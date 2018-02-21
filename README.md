# Upload server
This is the upload server for Confrere. The goal of the project is to provide a complete file uploading server which works on the user's terms. Currently it supports image uploading to S3, complete with client side configurable parameters for size and other restrictions. In the future we want to add more general file uploads, as well as more parameters to process files. See integration tests for more information on how to use the API.

Note that the server in its current form requires a little love if you want to configure it for your own use case, but mostly it can be configured through environment variables. Contributions to make this even more general is welcome!

## Configuration
See `config/custom-environment-variables.json` for documentation. This project uses https://www.npmjs.com/package/config.

## Deployment
Currently this is set up to automatically run on Elastic Beanstalk if you just zip it up and put it there. But with some configuration you can run it anywhere node runs too.
