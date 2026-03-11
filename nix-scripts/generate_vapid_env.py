import argparse
import base64

from cryptography.hazmat.primitives.asymmetric import ec


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def generate_vapid_values() -> tuple[str, str]:
    private_key = ec.generate_private_key(ec.SECP256R1())
    private_numbers = private_key.private_numbers()
    private_bytes = private_numbers.private_value.to_bytes(32, "big")

    public_numbers = private_key.public_key().public_numbers()
    public_bytes = (
        b"\x04"
        + public_numbers.x.to_bytes(32, "big")
        + public_numbers.y.to_bytes(32, "big")
    )

    return b64url(public_bytes), b64url(private_bytes)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate VAPID env file")
    parser.add_argument("output_path")
    parser.add_argument("--admin-email", default="admin@example.com")
    args = parser.parse_args()

    public_key, private_key = generate_vapid_values()
    with open(args.output_path, "w", encoding="utf-8") as env_file:
        env_file.write(f"VAPID_PUBLIC_KEY={public_key}\n")
        env_file.write(f"VAPID_PRIVATE_KEY={private_key}\n")
        env_file.write(f"VAPID_ADMIN_EMAIL={args.admin_email}\n")


if __name__ == "__main__":
    main()
