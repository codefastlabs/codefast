import fs from 'node:fs';
import path from 'node:path';

import { faker } from '@faker-js/faker';
import { consola } from 'consola';

import { labels, priorities, statuses } from './data';

const tasks = Array.from({ length: 100 }, () => ({
  id: `TASK-${faker.number.int({ max: 9999, min: 1000 }).toString()}`,
  label: faker.helpers.arrayElement(labels).value,
  priority: faker.helpers.arrayElement(priorities).value,
  status: faker.helpers.arrayElement(statuses).value,
  title: faker.hacker.phrase().replace(/^./, (letter) => letter.toUpperCase()),
}));

fs.writeFileSync(path.join(import.meta.dirname, 'tasks.json'), JSON.stringify(tasks, null, 2));

consola.log('✅ Tasks data generated.');
