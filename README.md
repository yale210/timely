<h1>
  <span style="color: lightblue; font-weight: bold; font-size: 3rem;">
    Timely
  </span>
</h1>

<p style="font-size: 1.5rem;">
  Time management system for students in higher education
</p>

The website has been deployed on [timely.subhan.work](https://timely.subhan.work/)

## Repo setup:

### Activate venv:
python -m venv venv

source venv/bin/activate

### Install python dependencies:
pip install -r backend/requirements.txt

### Install frontend dependencies:
npm install

### Make migrations and migrate:
python backend/manage.py makemigrations

python backend/manage.py migrate


## Local Testing:

### Start development server:
python backend/manage.py runserver

cd frontend

npm start

- Visit http://localhost:REPLACE_WITH_PORT_NUMBER/ from terminal on your web browser


## Before Committing:

### Install and run ruff
pip install ruff (if you havent already)

ruff format --check 

ruff check

### Install and run ESlint
cd frontend

npm install eslint (if you havent already)

npx eslint --init (if you havent already)

npx eslint src/