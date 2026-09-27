// A template (unlike the layout) remounts whenever the section under
// /admin changes, so this plays a short native-style fade-up on each
// section switch — on the loading skeleton first, then the page streams in
// in place. Search-param changes (filter tabs, ?open=…) don't remount it,
// so filtering never re-animates the page.
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
