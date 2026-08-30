import { LoginForm } from "@/components/admin/login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return <LoginForm nextPath={next} />
}
