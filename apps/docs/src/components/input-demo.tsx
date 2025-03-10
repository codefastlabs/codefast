import type { JSX } from 'react';

import { Input } from '@codefast/ui';
import { MailIcon } from 'lucide-react';

export function InputDemo(): JSX.Element {
  return (
    <div className="flex flex-col flex-wrap gap-4 md:flex-row">
      <Input placeholder="Email" type="email" />
      <Input aria-invalid="true" placeholder="Error" type="text" />
      <Input placeholder="Password" type="password" />
      <Input placeholder="Number" type="number" />
      <Input placeholder="File" type="file" />
      <Input placeholder="Tel" type="tel" />
      <Input placeholder="Text" type="text" />
      <Input placeholder="URL" type="url" />
      <Input placeholder="Search" type="search" />
      <Input placeholder="Date" type="date" />
      <Input placeholder="Datetime Local" type="datetime-local" />
      <Input placeholder="Month" type="month" />
      <Input placeholder="Time" type="time" />
      <Input placeholder="Week" type="week" />
      <Input loading placeholder="Loading..." />
      <Input disabled placeholder="Disabled" />
      <Input readOnly defaultValue="Read Only" placeholder="Read Only" />
      <Input placeholder="Email" prefix={<MailIcon />} type="email" />
      <Input placeholder="Email" suffix={<MailIcon />} type="email" />
    </div>
  );
}
