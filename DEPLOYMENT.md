# WellBroomed - Backend Deployment

### Deployment protocols and procedures for [WellBroomed](https://www.wellbroomed.com).

## Table of Contents

1. [Heroku](#Heroku)
2. [Mailgun](#Mailgun)
3. [Cloudinary](#Cloudinary)
4. [Auth0](#Auth0)
5. [Internal JWT](#Internal-JWT)
6. [PGAdmin - Local Postgres](#PGAdmin)
7. [Dependencies](#Dependencies)
8. [Heroku Environment Variables](#Heroku-Environment-Variables)
9. [Migrations](#Migrations)
10. [Uptime Robot](#Uptime-Robot)

These are the deployment guidelines and procedures for initiating a deployment of the WellBroomed backend architecture.

WellBroomed is hosted on a [Heroku](https://www.heroku.com) backend, which was chosen for its ease of continuous integration and git monitoring as well as a robust selection of third-party provisions that can be added to applications. You may wish to choose another backend deployment provider, but for the purposes of this documentation we will assume you have chosen Heroku as well. The basic gist is that you'll need certain environment variables and credentials regardless of which provider you choose, so we will walk you through the necessary third-party services that are required for WellBroomed to function correctly.

First, make sure you have a fork cloned to your local machine. This cloned repository is where you'll be making your edits in order to provision your own deployment.

Next, in the backend directory, you'll want to create a `.env` file in the top level directory. Create a file simply called `.env`.

:exclamation: **Make sure to include `.env` inside of your `.gitignore` file, or you will push your sensitive credentials to a public directory, which is insecure and difficult to remove.** :exclamation:

We'll be creating some accounts and plugging their details into this `.env` file throughout this process. But first things first...

## Heroku

Let's initialize the application in Heroku. Sign up or login to your [Heroku](https://www.heroku.com/) account.

Once logged in, create a new application and name it whatever you fancy.

Once the application is created, you'll want to "configure some addons".

Click the "configure some addons" button, and search the directory for "Heroku Postgres". The Heroku Postgres addon for Hobby Dev is free and should suit your purposes fine. Add it to the application, and it should be attached as a DATABASE to your app automatically. We'll handle the migrations later on, as you'll need some other credentials first before we can run them.

Additionally, I would recommend adding the "Papertrail" add-on as well. It will give you easy access to the server logs should you need to track down any issues.

## Mailgun

Mailgun is the email client that will be sending email notifications through the backend. 

You can sign up for a free account at [mailgun.com](https://www.mailgun.com). I would recommend signing up with Mailgun directly rather than provisioning the Heroku addon, due to the way the price structure is different for each option. 

Basically, you'll need to have a credit card on file at Mailgun in order to create custom email domains, which are necessary to send emails in production mode once the site is live. It's free for the first 10,000 emails per month.

Alternatively, provisioning through Heroku requires you to bump up another pay step in order to have custom domains, and doesn't seem to offer custom domains on a pay-as-you-go pricing model. 

So, as I said, signing up with Mailgun directly is the better choice in my opinion, as you still get an ostensibly free service but can create custom domains which are needed for sending live emails. 

Once your card is on file, you can head to "Domains" and click "Add New Domain". Follow the setup instructions provided, they're pretty straightforward. I'd recommend sticking with their suggestion of using a `mg` prefix for your domain name (e.g. `mg.mydomain.com`). Be sure NOT to use any traditional HTTP prefixes like `www`, as this will cause problems with DNS propagation later on. 

Once your domain is setup in Mailgun, you'll need to plug some values into your `.env` file. 

The first will be your `MAILGUN_URL` value. This is the domain that you created during setup. So, in the `.env` file it should look something like this.

```
MAILGUN_URL = 'mg.mydomain.com'
```

Next, you need your API key. In Mailgun, click on the "Settings" tab in the navigation, then head to "API Security". 

Click the eyeball to reveal the "Private API Key". Copy and paste that as the value for your `MAILGUN_KEY` value in the `.env` file. So, an example:

```
MAILGUN_KEY = '123abc456def789ghi-012jkl345mno-678pqr`
```

Once those two values are plugged into the `.env` file, that's all the setup you need to do on the backend. 

## Cloudinary

Next we'll be initializing [Cloudinary](https://cloudinary.com) as our cloud storage provider for image uploads. For Cloudinary, you can choose whether to sign up through them directly or to provision an add-on in Heroku, as their free tier model is essentially the same either way. 

You'll need to grab 3 credentials from your Cloudinary account details and plug them into your `.env` file. These values are directly accessible from the dashboard at the top of the page. It should look something like this:

```
CLOUD_NAME = 'my-cloud-name'
CLOUDINARY_API_KEY = '1234567890'
CLOUDINARY_API_SECRET = 'abcd1234efgh5678'
```

Once those are plugged in, you should be good to go for Cloudinary.

## Auth0

Now we need to grab our Auth0 credentials that we'll be using for our login and authentication process. 

Head over to [Auth0](https://www.auth0.com) and sign-up or login to your account. In the top right, click the account tab and then "Create Tenant". Once the tenant is created, it should switch you into it automatically. If not, click "Switch Tenant" in the account dropdown.

Once you're in your newly created tenant, click "Applications" on the left navigation. Create a new Application, assigning it as a "Single Page Web Application". 

You'll need to do some configuration here. 

Inside of your callback URLs, you'll want to add the URLs that you allow the tenant to redirect to upon sign-ups and logins. 

It should look something like this:

```
http://localhost:3000/callback, https://www.my-domain.com/callback
```

Obviously replacing the localhost port with whichever port you're working on locally, and the domain with whichever domain name you settle on for staging and/or production. A Netlify address is fine here if you haven't purchased a domain.

:exclamation: **Make sure there are no trailing backslashes on your URLs here, it'll save you some headache later on.** :exclamation:

Next, you need to set your Allowed Web Origins. It's a similar process:

```
http://localhost:3000, https://my-domain.com
```

Then, set your Logout URLs. These are URLs that the tenant will have permission to redirect to upon logging out of the application. 

```
http://localhost:3000, https://my-domain.com
```

Finally, set your Allowed Origins (CORS):

```
http://localhost:3000, https://my-domain.com, https://*.my-domain.com
```

The `*` is a wildcard catch-all that will manage any subdomains such as `www`. 

Now that the Auth0 tenant is configured, you'll need to grab some credentials from the application and plug them into your `.env` file. It should look like this:

```
AUTH0_DOMAIN = 'mydomain.auth0.com'
AUTH0_CLIENT_ID = 'aBcDeFg1234567'
AUTH0_API = 'https://mydomain.auth0.com/api/v2/'
```

There is one more thing you'll need from Auth0 in order to properly execute account updates such as new emails and passwords for users that sign in via username instead of social provider.

Head to the "APIs" section of your tenant. Click into the Auth0 Management API. Head to "API Explorer". Click "Create and Authorize Test Application". Copy the token and paste it into your `.env` file with the following key:

```
AUTH0_MANAGEMENT_JWT = 'abcdefg1234567'
```

Now, a caveat here: the 'correct' way to access the management API is to programatically generate a token for it on the backend for each request, and send that generated token along with the request to the Auth0 management API. 

Using the token generated on the Auth0 Management API explorer section is fine for testing purposes, but is insufficient/not recommended for production as the token expiration will disqualify requests after about 2-3 days. 

So I guess our challenge to you is to ensure that you implement the proper procedure for this token's generation per-request in the backend server. The documentation is [here](https://auth0.com/docs/api/management/v2/tokens), it was just something that is not currently deployed in our repository. Good luck! :sweat_smile:

Once you have those configurations and credentials plugged in, Auth0 should be set to work on the backend.

## Internal JWT

Since we love JavaScript Web Tokens so much, we decided to use two of them!

The logic behind this was that there is information that we need for our purposes for the internal API of WellBroomed that would be cumbersome to try and inject into Auth0's tokens. So, we collect the information from the Auth0 profile and insert additional relevant information about the user into our own JWT, such as their `user_id` and `role`. 

This helps us differentiate between account types without having to query the database, and also allows us to have access to the `user_id` with each request without having to do a lookup based on their email. 

All you need to do is to create your own JWT secret inside of the `.env` file that you will sign your internal JWTs with. It'll look something like this:

```
JWT_SECRET = 'super secret passphrase that only you should know'
```

Choose something complex, preferably something alphanumeric with at least 16 characters. That should give you enough entropy to prevent brute-force decryption until the heat death of the universe.

## PGAdmin

Now that you have all of your `.env` values, you can start on provisioning your local database that you'll use for development. 

You'll want to make sure you have Postgres installed on your machine, so head to [Postgresql.org](https://www.postgresql.org) and download the latest version. Follow the installation instructions, and you'll have Postgres on your machine.

Next, head over to [PGAdmin.org](https://www.pgadmin.org), and click on their Download button. Select PGAdmin4, the version for your OS, whatever the latest release is (as of writing this, it is v4.10).

Install PGAdmin4, and run it once it's complete. It should open up a dashboard in your browser once the server is initialized. Right click on the left window section and click "Create > Server".

**Take note of the username and password that you assign to this server. You'll need those values later.**

Once the server is created, right click it and then choose "Create > Database". I would suggest naming it whatever you'll end up calling your app. Once it's created, you'll need to plug some values into your `.env` file, as well as your `knexfile.js`.

Inside the `.env`, add these values:

```
PG_PASSWORD = 'password-from-earlier'
PG_USER = 'username-from-earlier'
```

Inside your `knexfile.js`, make sure the `development.connection.database` value is whatever name you chose for the database.

```
development: { 
    ...,
    connection: {
        ...,
        database: 'YOUR_DB_NAME'
    }
}
```

## Dependencies

Now that you have your local database server running, and your `.env` values set up, make sure to install your dependencies. 

In the terminal, run `yarn install` from the backend's top level directory (it's the one with the `package.json` file).

Once your dependencies are installed, you're ready to run your migrations.

In the terminal, type `knex migrate:latest`. Your migrations should run, initializing the table structure and providing some dummy user data courtesy of Faker.js.

Once the migrations have completed, in the terminal type `yarn dev`. This will initialize your development server. If everything goes well, you should be in business and your backend is setup for local development. 

## Heroku Environment Variables

Now that your local dev environment is set up, it's time to initialize the Heroku deployment.

Heroku will need some environment variables in order to function properly. Head to the application in Heroku and go to Settings.

Click on Config Vars and add the following from your `.env` file:

```
AUTH0_API
AUTH0_CLIENT_ID
AUTH0_DOMAIN
AUTH0_MANAGEMENT_JWT
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUD_NAME
JWT_SECRET
MAILGUN_KEY
MAILGUN_URL
```

You'll need one more additional value to finish the Heroku env setup: the database URL from your Heroku Postgres add-on. 

If I remember correctly, this should actually be present automatically once the add-on is provisioned. But, in case it isn't, the key is `DATABASE_URL` and the value is the URL that begins with the `postgres://` prefix that can be found by clicking the Herok Postgres module in the app dashboard and checking the Database Credentials in the settings section. It should be listed under `URI`.

Once those values are plugged in, it's time to run your production migrations. 

## Migrations

I find the simplest way to run these is to go to the Heroku dashboard for your application, and in the upper right click the "More" dropdown. Then select "Run Console". 

In the console prompt, type `knex migrate:latest`. This should run your migrations, and your production database should be good to go. Keep note of this console in case you need to use it later for a rollback or re-migration should you make alterations to the migration files. 

## Uptime Robot

There is one more tool that I would recommend once your site is stable in production, and that's [UptimeRobot](https://uptimerobot.com/). With UptimeRobot, you can periodically ping your Heroku backend server so that it will not go to sleep and potentially disrupt service. The free edition allows you to ping the server every 5 minutes, which is sufficient to prevent a shutdown of the Heroku dyno. You'll also get monitoring updates and status reports in case the server goes offline for any reason. 

---

With all that complete, your backend deployment should be ready for development! :tada:

We hope you enjoy WellBroomed! :v:

Adam Reid


Max Kajiwara


Kevin Tena