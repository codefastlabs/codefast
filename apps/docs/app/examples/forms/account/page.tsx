import { Separator } from '@codefast/ui/separator';
import { type JSX } from 'react';
import { AccountForm } from '@/app/examples/forms/account/components/account-form';

export default function SettingsAccountPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-muted-foreground text-sm">
          Update your account settings. Set your preferred language and
          timezone.
        </p>
      </div>
      <Separator />
      <AccountForm />
    </div>
  );
}
