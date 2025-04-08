import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { documentClient } from './lambda/dynamodb/client';

const params = {
  TableName: 'artists',
  FilterExpression: 'contains(#name, :searchString)',
  ExpressionAttributeNames: {
    '#name': 'name',
  },
  ExpressionAttributeValues: {
    ':searchString': 'Corn',
  },
};

(async () => {
  const result = await documentClient.send(new ScanCommand(params));
  console.log(result.Items);
})();
