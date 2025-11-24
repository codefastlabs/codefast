import { createFileRoute } from '@tanstack/react-router';
import { CheckCircle2, Info, Moon, Palette, Sun } from 'lucide-react';

import { Button } from '@codefast/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@codefast/ui/card';
import { Badge } from '@codefast/ui/badge';
import { Separator } from '@codefast/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@codefast/ui/alert';
import type { Theme } from '@/integrations/theme/server';
import { useTheme } from '@/integrations/theme/use-theme';

export const Route = createFileRoute('/demo/theme')({
  component: ThemeDemo,
});

const themes: Theme[] = ['light', 'dark'];

function ThemeDemo() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Theme Demo</h1>
        <p className="text-muted-foreground">Demo tính năng theme switching với hỗ trợ light mode và dark mode.</p>
      </div>

      {/* Theme Switcher Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Switcher
          </CardTitle>
          <CardDescription>Chuyển đổi giữa các theme khác nhau</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {themes.map((themeOption) => {
              const isActive = theme === themeOption;
              const Icon = themeOption === 'light' ? Sun : Moon;

              return (
                <Button
                  key={themeOption}
                  variant={isActive ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setTheme(themeOption)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="capitalize">{themeOption}</span>
                  {isActive && <CheckCircle2 className="h-4 w-4" />}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Theme Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Theme State</CardTitle>
            <CardDescription>Thông tin về theme hiện tại</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">Selected Theme:</span>
                <Badge variant="outline" className="capitalize">
                  {theme}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">Available Themes:</span>
                <div className="flex gap-1">
                  {themes.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs capitalize">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme Features</CardTitle>
            <CardDescription>Các tính năng của theme system</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                <span>Hỗ trợ light mode và dark mode</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                <span>Lưu preference vào cookie</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                <span>Đồng bộ theme giữa các tabs</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                <span>Không có flash khi load trang (FOUC prevention)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                <span>Hỗ trợ CSS color-scheme property</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                <span className="font-semibold">disableTransitionOnChange: Đã bật</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* disableTransitionOnChange Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            disableTransitionOnChange Demo
          </CardTitle>
          <CardDescription>
            Tính năng này tạm thời vô hiệu hóa tất cả CSS transitions khi chuyển đổi theme để tránh hiệu ứng nhấp nháy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Tính năng đã được bật</AlertTitle>
            <AlertDescription>
              Tính năng <code className="rounded bg-muted px-1 py-0.5 text-xs">disableTransitionOnChange</code> đã được
              bật trong <code className="rounded bg-muted px-1 py-0.5 text-xs">__root.tsx</code>. Khi bạn chuyển đổi
              theme, tất cả CSS transitions sẽ tạm thời bị vô hiệu hóa để đảm bảo chuyển đổi mượt mà, không có hiệu
              ứng nhấp nháy.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Các phần tử có transition (sẽ bị vô hiệu hóa khi đổi theme):</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Card with transition */}
              <Card className="transition-all duration-500 hover:scale-105 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm">Card với transition</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Card này có transition cho scale và shadow. Khi đổi theme, transition sẽ tạm thời bị vô hiệu hóa.
                  </p>
                </CardContent>
              </Card>

              {/* Button with transition */}
              <div className="flex items-center justify-center rounded-lg border bg-card p-4 transition-all duration-500 hover:bg-accent">
                <Button className="transition-all duration-500 hover:scale-110">
                  Button với transition
                </Button>
              </div>

              {/* Badge with transition */}
              <div className="flex items-center justify-center gap-2 rounded-lg border bg-card p-4 transition-all duration-500 hover:border-primary">
                <Badge className="transition-all duration-500 hover:scale-110">Badge với transition</Badge>
              </div>
            </div>

            <div className="rounded-lg border bg-linear-to-r from-primary/10 to-secondary/10 p-6 transition-all duration-700">
              <h4 className="mb-2 text-sm font-semibold">Gradient box với transition dài</h4>
              <p className="text-xs text-muted-foreground">
                Box này có transition 700ms. Khi bạn chuyển đổi theme, transition này sẽ bị vô hiệu hóa tạm thời để đảm
                bảo chuyển đổi theme mượt mà.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Hướng dẫn test:</h4>
              <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                <li>Nhấn vào nút theme switcher ở trên để chuyển đổi theme</li>
                <li>Quan sát các phần tử trên - chúng sẽ thay đổi màu sắc ngay lập tức, không có animation</li>
                <li>Sau khi theme đã được áp dụng, transitions sẽ được bật lại</li>
                <li>Hover vào các phần tử để thấy transitions hoạt động bình thường</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Component Showcase</CardTitle>
          <CardDescription>Xem các component hiển thị trong theme hiện tại</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buttons */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Buttons</h3>
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          <Separator />

          {/* Badges */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>

          <Separator />

          {/* Alerts */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Alerts</h3>
            <div className="space-y-2">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Info Alert</AlertTitle>
                <AlertDescription>
                  Đây là một alert mẫu để demo theme. Component này sẽ tự động thay đổi màu sắc theo theme hiện tại.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <Separator />

          {/* Cards */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Cards</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Card 1</CardTitle>
                  <CardDescription>Mô tả cho card 1</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Nội dung của card sẽ tự động thích ứng với theme.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Card 2</CardTitle>
                  <CardDescription>Mô tả cho card 2</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Background và text colors thay đổi theo theme.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Card 3</CardTitle>
                  <CardDescription>Mô tả cho card 3</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Borders và shadows cũng được điều chỉnh tự động.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Explanation */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How it works</AlertTitle>
        <AlertDescription>
          Theme system sử dụng React Context để quản lý state và tự động áp dụng theme class vào document root. Khi bạn
          chuyển đổi theme, tất cả các component sử dụng Tailwind CSS classes với dark mode variants sẽ tự động cập
          nhật. Theme preference được lưu vào cookie để giữ nguyên khi reload trang và hỗ trợ SSR.
        </AlertDescription>
      </Alert>
    </div>
  );
}
