export function TypographyTable() {
  return (
    <div className="my-6 w-full overflow-y-auto">
      <table className="w-full">
        <thead>
          <tr className="m-0 border-t p-0 even:bg-muted">
            <th className="border px-4 py-2 text-start font-bold [&[align=center]]:text-center [&[align=right]]:text-end">
              King&apos;s Treasury
            </th>
            <th className="border px-4 py-2 text-start font-bold [&[align=center]]:text-center [&[align=right]]:text-end">
              People&apos;s happiness
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="m-0 border-t p-0 even:bg-muted">
            <td className="border px-4 py-2 text-start [&[align=center]]:text-center [&[align=right]]:text-end">
              Empty
            </td>
            <td className="border px-4 py-2 text-start [&[align=center]]:text-center [&[align=right]]:text-end">
              Overflowing
            </td>
          </tr>
          <tr className="m-0 border-t p-0 even:bg-muted">
            <td className="border px-4 py-2 text-start [&[align=center]]:text-center [&[align=right]]:text-end">
              Modest
            </td>
            <td className="border px-4 py-2 text-start [&[align=center]]:text-center [&[align=right]]:text-end">
              Satisfied
            </td>
          </tr>
          <tr className="m-0 border-t p-0 even:bg-muted">
            <td className="border px-4 py-2 text-start [&[align=center]]:text-center [&[align=right]]:text-end">
              Full
            </td>
            <td className="border px-4 py-2 text-start [&[align=center]]:text-center [&[align=right]]:text-end">
              Ecstatic
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
