[![Maintainability](https://api.codeclimate.com/v1/badges/0b8dcd3138fe86ea14ec/maintainability)](https://codeclimate.com/github/niyodusengaclement/tekana-ewallet/maintainability)
# TEKANA E-WALLET
Tekana eWallet is an app used to transfer money from one wallet to another all over the world
### GitHub repository link
[Tekana eWallet/Repo](https://github.com/niyodusengaclement/tekana-ewallet)

### Heroku app Link
[Tekana eWallet/Heroku app Link](http://tekana-ewallet.herokuapp.com/api-docs)

--------------------------------------------------------------------------

## Project Requirements
- User should signup by filling all required information, when validation rules are respected and then new record is created otherwise response is shown with error happened underneath.

- To meet KYC (Know Your Customer) procedure we should verify user identity. For Rwandese users only,  `NIDA API` should be invoked to validate National ID then we should also send OTP validation to confirm user phone number. (We might validate international identity and phone number in the next version)

- User should be able to regenerate New OTP when previously sent OTP was not recevied or expired.

- Registered user should use phone number and password to login yet response body show status code  along with appropriate message when user credentials are valid, a JWT token is returned to authenticate user to the protected routes.

- Authorized user should be able to create one wallet by currency later on providing name and currency.

- Authorized user should be able his or her list wallets 

- Authorized user should be able to get his or her specific wallet by using wallet id.
- We would love to do work on topup and withraw your wallet to MoMo or Bank acount but due to the small amount of time we may work on this in the future (Next release😎). For now when a user creates a new wallet s/he should get a bonus of 5000 USD to use (It's too much money, but for the sake of test) 

- Sender should provide  `destination wallet id, transaction amount and currency` then s/he should recieve an OTP to confirm transaction in 5 minutes otherwise transaction fail. Here cron job should be running every 10 minutes to check transactions that have not been confirmed and mark them as failed.
- If transaction is confirmed, destination wallet we should remove transaction amount and fee to the source wallet and add transaction amount to the destination wallet. (Fee is our income😛)

- Authorized user should be able to get a list of his/her transfer transactions
- Authorized user should be able to get a list of his/her transfer transactions by status
- Authorized user should be able to get a list of his/her wallet received transactions
- Authorized user should get a specific transaction detail by providing its ID


 ## Features 
|Method| Endpoint | Description |
| ------ | ------ |--|
| **POST**  | /api/auth/signup | user registration |
| **POST** |  /api/auth/Signin | user signin |
| **POST** |  /api/auth/otp-verification | Verify OTP |
| **GET**  | /api/auth/resend-otp/{phone} | Resend an OTP |
| **POST** |  /api/wallets | Create new wallet |
| **GET**  | /api/wallets | Get list of wallets |
| **GET**  | /api/wallets/by-id/{id} | Get wallet details by id |
| **POST** |  /api/transactions |  Create new transaction|
| **GET**  | /api/transactions/sent |  Fetch list of user transfer transactions |
| **GET**  | /api/transactions/sent/{status} |  Fetch list of user transfer transactions by status |
| **GET**  | /api/transactions/received/{walletId} |  Fetch list of wallet received transactions |
| **GET**  | /api/transactions/{id} |  Fetch specific transaction by id |
| **PATCH** |  /api/transactions/confirm/{id} |  Confirm transaction |

--------------------------------------------------------------------------
## Tools

### Language
```
Typescript
```
### Server Environment
```
 *NestJS* (NestJS is a framework for building efficient, scalable Node.js web applications. )
 ```
 ### Database
```
 PostgreSQL
```
 ### ORM
```
 Prisma
```
### Containerization
```
 Docker
```
### Testing Framework and Assertion library
```
 Jest
```
### Testing Framework and Assertion library
```
 Jest
```
### Continuous Integration
```
GitHub Actions
```
## Getting Started
Follow instructions below to have this project running in your local machine
### Prerequisites
You must have NodeJS, and NestJS installed
Clone this repository ```https://github.com/niyodusengaclement/tekana-ewallet.git``` or download the zip file.

### Installing
After cloning this repository to your local machine, cd into its root directory using your terminal and run the following commands

```bash
$ yarn
```

Yarn will install all dependencies.
### Running the app locally with yarn

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```
### Running the app locally with docker
```bash
# new docker version
$ docker compose up --build

# old docker version
$ docker-compose up --build
```


> If you need some env variables like SMS KEYS, NIDA API ... you can contact me clementmistico@gmail.com or +250780282575.
> For testing purpose 123456 is always valid OTP (to be removed in production mode), on either phone verification or transaction confirmation.


### Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## Authors

- [NIYODUSENGA Clement](https://github.com/niyodusengaclement)
