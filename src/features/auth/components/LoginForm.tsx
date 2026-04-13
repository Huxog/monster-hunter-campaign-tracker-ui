import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { loginSchema, type LoginInput } from '../schemas';
import { useLogin } from '../api';
import { Field, Input } from '../../../shared/components/Field';
import { Button } from '../../../shared/components/Button';
import { ApiError } from '../../../shared/lib/apiClient';

export function LoginForm() {
  const navigate = useNavigate();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    login.mutate(data, {
      onSuccess: () => void navigate({ to: '/dashboard' }),
    });
  };

  const serverError =
    login.error instanceof ApiError ? login.error.message : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <Field label="Email" error={errors.email?.message}>
        {(id, hasError) => (
          <Input
            {...register('email')}
            id={id}
            type="email"
            autoComplete="email"
            placeholder="hunter@example.com"
            hasError={hasError}
          />
        )}
      </Field>

      <Field label="Password" error={errors.password?.message}>
        {(id, hasError) => (
          <Input
            {...register('password')}
            id={id}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            hasError={hasError}
          />
        )}
      </Field>

      {serverError && (
        <p role="alert" className="rounded-md border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
          {serverError}
        </p>
      )}

      <Button type="submit" fullWidth loading={login.isPending} className="mt-1">
        Sign in
      </Button>
    </form>
  );
}
