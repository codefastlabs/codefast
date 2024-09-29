import { Separator } from '@codefast/ui';
import { type JSX } from 'react';
import { ProfileForm } from '@/app/examples/forms/_components/profile-form';

export default function SettingsProfilePage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-muted-foreground text-sm">This is how others will see you on the site.</p>
      </div>
      <Separator />
      <ProfileForm />
    </div>
  );
}
