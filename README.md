## How does it work?

Test Training Images of Wine can be downloaded from:
https://s3.console.aws.amazon.com/s3/buckets/vis-search-custom-s3buckettraining-gi5xok98fvj3/data/ER-Video/?region=us-east-2&tab=overview

Each image for training generates a 2048 feature vector using a convolutional neural networks and gets stored into Amazon Elasticsearch KNN index

When a new query image is sent to the created API Gateway, a lambda funtion extracts the 2048 feature vectors generated from a CNN hosted in Amazon SageMaker and then queried against the feature vectors stored in an Amazon Elasticsearch KNN index to find similar images.




