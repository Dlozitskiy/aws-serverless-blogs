# Serverless Blogs Notifier for MS Teams

## Development workflow

1. Start dynamodb docker container:

```
docker run -p 8000:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -inMemory -sharedDb
```

1. Create tables required by the function code as below:

```
aws dynamodb create-table --table-name BlogsTable --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url http://localhost:8000
```

3. Make sure the table was created:

```
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

4. Update your MS Teams `WebhookUrl` in `sam-local.env.json`.

5. Invoke function with local variables from `sam-local.env.json`:

```
sam local invoke --env-vars sam-local.env.json 
```

## Deploying in your account

1. Configure github repository with following secrets:


`AWS_ACCESS_KEY_ID` - IAM user access key id to deploy to AWS account

`AWS_SECRET_ACCESS_KEY` - IAM user secret access key to deploy to AWS account

`WEBHOOKURL` - URL of your MS Teams webhook

`S3BUCKET` - S3 bucket in your account to upload deployment package to

2. Commit to the main branch and github actions will automatically deploy your stack