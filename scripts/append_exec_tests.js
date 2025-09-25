const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'sample', 'test_system_completed_requests.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const additions = [
  {
    completed_requests: {
      requestTime: '2025-09-24T10:00:00.000Z',
      elapsedTime: '120.000ms',
      serviceTime: '118.000ms',
      cpuTime: '5.000ms',
      state: 'completed',
      resultCount: 5,
      resultSize: 2048,
      scanConsistency: 'request_plus',
      users: 'local:test_user',
      statement: '<ud>EXECUTE myPrepared($userId)</ud>',
      preparedText: "SELECT u.name FROM `users` u WHERE u.userId = $userId"
    },
    plan: '{"#operator":"Authorize","#stats":{"execTime":"2µs","servTime":"5µs"},"~child":{"#operator":"Sequence","~children":[{"#operator":"Stream","#stats":{"execTime":"1ms"}}]}}'
  },
  {
    completed_requests: {
      requestTime: '2025-09-24T10:05:00.000Z',
      elapsedTime: '220.000ms',
      serviceTime: '215.000ms',
      cpuTime: '6.000ms',
      state: 'completed',
      resultCount: 10,
      resultSize: 4096,
      scanConsistency: 'scan_plus',
      users: 'local:test_user2',
      statement: '<UD>EXECUTE "myPrepared2"</UD>',
      preparedText: "SELECT o.orderId, o.total FROM `orders` o WHERE o.customerId = $custId"
    },
    plan: '{"#operator":"Authorize","#stats":{"execTime":"2µs","servTime":"5µs"},"~child":{"#operator":"Sequence","~children":[{"#operator":"Stream","#stats":{"execTime":"1ms"}}]}}'
  }
];

data.push(...additions);
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log(`Appended ${additions.length} EXECUTE test records to ${file}`);
