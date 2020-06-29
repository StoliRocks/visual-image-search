## How does it work?

Optionally Create an AWS Cloud Formation Using the Following link:<br/>
https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https://stvwhite-projects-virginia.s3.amazonaws.com/initial_template.yaml&stackName=visual-image-search

Use the following sample dataset for Training Images of Wine:<br/>
https://s3.console.aws.amazon.com/s3/buckets/vis-search-custom-s3buckettraining-gi5xok98fvj3/data/ER-Video/?region=us-east-2&tab=overview

Upload these directories and images to your training bucket that is created in the CFN step to a directory called 'data' such as:<br/>
s3://#bucket-name#/data

In the Jupyter Notebook, use the directory names or similar name to the following variable <br/>
#Define some utility function<br/>
name = <'Product Name Goes Here'>  # Fill in Directory Name Here

Each image for training generates a 2048 feature vector using a convolutional neural networks and gets stored into Amazon Elasticsearch KNN index.

When a new query image is sent to the created API Gateway, a lambda funtion extracts the 2048 feature vectors generated from a CNN hosted in Amazon SageMaker and then queried against the feature vectors stored in an Amazon Elasticsearch KNN index to find similar images.




