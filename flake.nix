{
  description = "Timely development flake with examiner entrypoints";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachSystem [
      "x86_64-linux"
      "aarch64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ]
      (system:
        let
          pkgs = import nixpkgs { inherit system; };

          python = pkgs.python312;
          node = pkgs.nodejs_20;

          commonEnv = ''
            TIMELY_ROOT="$(pwd)"
            export TIMELY_ROOT
            export POSTGRES=False
            export DB_PATH="$TIMELY_ROOT/.nix-state/db.sqlite3"
            export DEBUG=True
            export REDIS_URL="redis://127.0.0.1:6379/0"
            export ENABLE_RECURRENCE_OVERRIDES=True
            mkdir -p "$TIMELY_ROOT/.nix-state" "$TIMELY_ROOT/.nix-state/logs"
            export TIMELY_VENV="$TIMELY_ROOT/.nix-state/venv"
            export TIMELY_VAPID_ENV="$TIMELY_ROOT/.nix-state/vapid.env"
          '';

          vapidSetup = ''
            if [ ! -f "$TIMELY_VAPID_ENV" ]; then
              echo "Generating VAPID keys in $TIMELY_VAPID_ENV"
              "$TIMELY_VENV/bin/python" "$TIMELY_ROOT/nix-scripts/generate_vapid_env.py" "$TIMELY_VAPID_ENV"
            fi

            set -a
            # shellcheck source=/dev/null
            . "$TIMELY_VAPID_ENV"
            set +a
          '';

          installDeps = ''
            if [ ! -x "$TIMELY_VENV/bin/python" ]; then
              echo "Creating Python virtualenv in $TIMELY_VENV"
              python -m venv "$TIMELY_VENV"
            fi

            "$TIMELY_VENV/bin/pip" install --upgrade pip
            "$TIMELY_VENV/bin/pip" install -r "$TIMELY_ROOT/backend/requirements.txt"

            echo "Installing frontend dependencies with npm ci"
            npm --prefix "$TIMELY_ROOT/frontend" ci
          '';
        in
        {
          packages = rec {
            default = pkgs.writeShellApplication {
              name = "timely-help";
              runtimeInputs = [ python node ];
              text = ''
                printf '%s\n' \
                  "Available entrypoints:" \
                  "  nix run .#init    - install deps, migrate SQLite DB, and seed data" \
                  "  nix run .#run     - run Redis, Django, Celery worker/beat, and frontend" \
                  "  nix run .#tests   - run all tests and generate coverage output" \
                  "  nix run .#seed    - seed database data" \
                  "  nix run .#unseed  - remove all seeded user data"
              '';
            };

            init = pkgs.writeShellApplication {
              name = "timely-init";
              runtimeInputs = [ python node ];
              text = ''
                set -euo pipefail
                ${commonEnv}
                ${installDeps}
                ${vapidSetup}

                "$TIMELY_VENV/bin/python" "$TIMELY_ROOT/backend/manage.py" migrate
                "$TIMELY_VENV/bin/python" "$TIMELY_ROOT/backend/manage.py" seed

                printf '%s\n' \
                  "Initialisation complete." \
                  "SQLite DB: $DB_PATH" \
                  "Seeded data: yes" \
                  "Next:" \
                  "  nix run .#tests" \
                  "  nix run .#run"
              '';
            };

            seed = pkgs.writeShellApplication {
              name = "timely-seed";
              runtimeInputs = [ python node ];
              text = ''
                set -euo pipefail
                ${commonEnv}
                ${installDeps}
                ${vapidSetup}
                "$TIMELY_VENV/bin/python" "$TIMELY_ROOT/backend/manage.py" seed
                echo "Database seeded using SQLite at $DB_PATH"
              '';
            };

            unseed = pkgs.writeShellApplication {
              name = "timely-unseed";
              runtimeInputs = [ python node ];
              text = ''
                set -euo pipefail
                ${commonEnv}
                ${installDeps}
                ${vapidSetup}
                "$TIMELY_VENV/bin/python" "$TIMELY_ROOT/backend/manage.py" unseed
                echo "Database unseeded using SQLite at $DB_PATH"
              '';
            };

            tests = pkgs.writeShellApplication {
              name = "timely-tests";
              runtimeInputs = [ python node ];
              text = ''
                set -euo pipefail
                ${commonEnv}
                ${installDeps}
                ${vapidSetup}

                mkdir -p "$TIMELY_ROOT/.nix-state/coverage/backend" "$TIMELY_ROOT/.nix-state/coverage/frontend"

                (
                  cd "$TIMELY_ROOT/backend"
                  "$TIMELY_VENV/bin/coverage" erase
                  "$TIMELY_VENV/bin/coverage" run manage.py test
                  "$TIMELY_VENV/bin/coverage" report -m
                  "$TIMELY_VENV/bin/coverage" xml -o "$TIMELY_ROOT/.nix-state/coverage/backend/coverage.xml"
                  "$TIMELY_VENV/bin/coverage" html -d "$TIMELY_ROOT/.nix-state/coverage/backend/html"
                )

                (
                  cd "$TIMELY_ROOT/frontend"
                  npm run test -- --coverage --coverage.reportsDirectory="$TIMELY_ROOT/.nix-state/coverage/frontend"
                )

                printf '%s\n' \
                  "Tests complete." \
                  "Coverage outputs:" \
                  "  Backend XML: $TIMELY_ROOT/.nix-state/coverage/backend/coverage.xml" \
                  "  Backend HTML: $TIMELY_ROOT/.nix-state/coverage/backend/html" \
                  "  Frontend:    $TIMELY_ROOT/.nix-state/coverage/frontend"
              '';
            };

            run = pkgs.writeShellApplication {
              name = "timely-run";
              runtimeInputs = [ python node pkgs.redis ];
              text = ''
                set -euo pipefail
                ${commonEnv}

                if [ ! -x "$TIMELY_VENV/bin/python" ] || [ ! -d "$TIMELY_ROOT/frontend/node_modules" ]; then
                  echo "Dependencies not initialized. Run: nix run .#init"
                  exit 1
                fi

                ${vapidSetup}

                # shellcheck disable=SC2317
                cleanup() {
                  echo "Stopping services..."
                  if [ -n "''${FRONTEND_PID:-}" ]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
                  if [ -n "''${BEAT_PID:-}" ]; then kill "$BEAT_PID" 2>/dev/null || true; fi
                  if [ -n "''${WORKER_PID:-}" ]; then kill "$WORKER_PID" 2>/dev/null || true; fi
                  if [ -n "''${DJANGO_PID:-}" ]; then kill "$DJANGO_PID" 2>/dev/null || true; fi
                  if [ -n "''${REDIS_PID:-}" ]; then kill "$REDIS_PID" 2>/dev/null || true; fi
                  wait || true
                }
                trap cleanup EXIT INT TERM

                redis-server --save "" --appendonly no --port 6379 \
                  > "$TIMELY_ROOT/.nix-state/logs/redis.log" 2>&1 &
                REDIS_PID=$!

                (
                  cd "$TIMELY_ROOT/backend"
                  "$TIMELY_VENV/bin/python" manage.py runserver 0.0.0.0:8000
                ) > "$TIMELY_ROOT/.nix-state/logs/django.log" 2>&1 &
                DJANGO_PID=$!

                (
                  cd "$TIMELY_ROOT/backend"
                  "$TIMELY_VENV/bin/celery" -A source worker --loglevel=info
                ) > "$TIMELY_ROOT/.nix-state/logs/celery-worker.log" 2>&1 &
                WORKER_PID=$!

                (
                  cd "$TIMELY_ROOT/backend"
                  "$TIMELY_VENV/bin/celery" -A source beat --loglevel=info
                ) > "$TIMELY_ROOT/.nix-state/logs/celery-beat.log" 2>&1 &
                BEAT_PID=$!

                (
                  cd "$TIMELY_ROOT/frontend"
                  npm run dev -- --host 0.0.0.0 --port 80
                ) > "$TIMELY_ROOT/.nix-state/logs/frontend.log" 2>&1 &
                FRONTEND_PID=$!

                printf '%s\n' \
                  "Services started:" \
                  "  Frontend: http://localhost" \
                  "  Backend:  http://localhost:8000" \
                  "Logs:" \
                  "  $TIMELY_ROOT/.nix-state/logs/redis.log" \
                  "  $TIMELY_ROOT/.nix-state/logs/django.log" \
                  "  $TIMELY_ROOT/.nix-state/logs/celery-worker.log" \
                  "  $TIMELY_ROOT/.nix-state/logs/celery-beat.log" \
                  "  $TIMELY_ROOT/.nix-state/logs/frontend.log" \
                  "Press Ctrl+C to stop all services."

                wait -n "$REDIS_PID" "$DJANGO_PID" "$WORKER_PID" "$BEAT_PID" "$FRONTEND_PID"
                echo "A service exited. Stopping remaining services."
                exit 1
              '';
            };
          };

          apps = {
            default = flake-utils.lib.mkApp {
              drv = self.packages.${system}.default;
            };
            init = flake-utils.lib.mkApp {
              drv = self.packages.${system}.init;
            };
            run = flake-utils.lib.mkApp {
              drv = self.packages.${system}.run;
            };
            tests = flake-utils.lib.mkApp {
              drv = self.packages.${system}.tests;
            };
            seed = flake-utils.lib.mkApp {
              drv = self.packages.${system}.seed;
            };
            unseed = flake-utils.lib.mkApp {
              drv = self.packages.${system}.unseed;
            };
          };

          devShells.default = pkgs.mkShell {
            packages = [
              python
              node
              pkgs.redis
              pkgs.ruff
            ];
            shellHook = ''
              printf '%s\n' \
                "Timely development shell" \
                "" \
                "Required entrypoints:" \
                "  nix run .#init" \
                "  nix run .#tests" \
                "  nix run .#run" \
                "" \
                "Optional entrypoints:" \
                "  nix run .#seed" \
                "  nix run .#unseed"
            '';
          };

          formatter = pkgs.alejandra;
        });
}
