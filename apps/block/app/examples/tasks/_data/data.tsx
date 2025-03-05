import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from '@radix-ui/react-icons';

export const labels = [
  {
    label: 'Bug',
    value: 'bug',
  },
  {
    label: 'Feature',
    value: 'feature',
  },
  {
    label: 'Documentation',
    value: 'documentation',
  },
];

export const statuses = [
  {
    icon: QuestionMarkCircledIcon,
    label: 'Backlog',
    value: 'backlog',
  },
  {
    icon: CircleIcon,
    label: 'Todo',
    value: 'todo',
  },
  {
    icon: StopwatchIcon,
    label: 'In Progress',
    value: 'in progress',
  },
  {
    icon: CheckCircledIcon,
    label: 'Done',
    value: 'done',
  },
  {
    icon: CrossCircledIcon,
    label: 'Canceled',
    value: 'canceled',
  },
];

export const priorities = [
  {
    icon: ArrowDownIcon,
    label: 'Low',
    value: 'low',
  },
  {
    icon: ArrowRightIcon,
    label: 'Medium',
    value: 'medium',
  },
  {
    icon: ArrowUpIcon,
    label: 'High',
    value: 'high',
  },
];
