const axios = require("axios");
var xml2js = require("xml2js");
var parser = new xml2js.Parser();

const DynamoDB = require("aws-sdk/clients/dynamodb");

const dynamodb = new DynamoDB({
  endpoint: process.env.DDB_ENDPOINT_OVERRIDE
    ? process.env.DDB_ENDPOINT_OVERRIDE
    : undefined,
});

const ddbclient = new DynamoDB.DocumentClient({ service: dynamodb });

exports.handler = async () => {
  try {
    const response = await axios.get(process.env.feedUrl);

    var published = await ddbclient
      .get({
        TableName: process.env.table,
        Key: {
          id: "posts",
        },
      })
      .promise()
      .then(function (data) {
        if (data.Item) {
          return data.Item.data.slice(-30);
        } else {
          return [];
        }
      });

    console.log(published);

    await parser
      .parseStringPromise(response.data)
      .then(async function (result) {
        var items = result.rss.channel[0].item;
        for (var i = 0; i < items.length; i++) {
          if (
            items[i].category &&
            items[i].category
              .map((i) => i.toLowerCase())
              .indexOf("serverless") > -1 &&
            published.indexOf(items[i].guid[0]._) == -1
          ) {
            published.push(items[i].guid[0]._);

            await axios({
              url: `${process.env.WebhookUrl}`,
              method: "post",
              data: `{
                      "type":"message",
                      "attachments":[
                         {
                       "contentType": "application/vnd.microsoft.card.thumbnail",
                       "content": {
                           "title": "${items[i].title[0]}",
                           "subtitle": "by ${items[i]["dc:creator"][0]}",
                           "text": "${items[i].description[0]}",
                           "images": [
                               {
                                   "alt": "",
                                   "url": "https://images.squarespace-cdn.com/content/v1/51814c87e4b0c1fda9c1fc50/1528473310893-RH0HG7R5C0QURMFQJBSU/ke17ZwdGBToddI8pDm48kOyctPanBqSdf7WQMpY1FsRZw-zPPgdn4jUwVcJE1ZvWQUxwkmyExglNqGp0IvTJZUJFbgE-7XRK3dMEBRBhUpyD4IQ_uEhoqbBUjTJFcqKvko9JlUzuVmtjr1UPhOA5qkTLSJODyitRxw8OQt1oetw/600px-AWS_Lambda_logo.svg.png"
                               }
                           ],
                           "buttons": [
                               {
                                   "type": "openUrl",
                                   "title": "Read the blog",
                                   "value": "${items[i].link[0]}"
                               }
                           ]
                       }
                   }
                      ]
                   }`,
              headers: {
                "Content-Type": "application/json",
              },
            });
            await ddbclient
              .put({
                TableName: process.env.table,
                Item: {
                  id: "posts",
                  data: published,
                },
              })
              .promise();
          }
        }
      });
  } catch (error) {
    console.error(error);
  }

  return published;
};
