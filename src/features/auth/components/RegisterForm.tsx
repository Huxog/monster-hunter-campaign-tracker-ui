import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { registerSchema, type RegisterInput } from '../schemas';
import { useRegister } from '../api';
import { Field, Input, type FieldTheme } from '../../../shared/components/Field';
import { Button } from '../../../shared/components/Button';
import { ApiError } from '../../../shared/lib/apiClient';

export interface RegisterFormProps {
  theme?: FieldTheme;
}

export function RegisterForm({ theme = 'dark' }: RegisterFormProps) {
  const navigate = useNavigate();
  const register = useRegister();

  const {
    register: bindField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterInput) => {
    register.mutate(data, {
      onSuccess: () => void navigate({ to: '/dashboard' }),
    });
  };

  const serverError =
    register.error instanceof ApiError ? register.error.message : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <Field label="Name" error={errors.name?.message} theme={theme}>
        {(id, hasError, t) => (
          <Input
            {...bindField('name')}
            id={id}
            type="text"
            autoComplete="name"
            placeholder="Your hunter name"
            hasError={hasError}
            theme={t}
          />
        )}
      </Field>

      <Field label="Email" error={errors.email?.message} theme={theme}>
        {(id, hasError, t) => (
          <Input
            {...bindField('email')}
            id={id}
            type="email"
            autoComplete="email"
            placeholder="hunter@example.com"
            hasError={hasError}
            theme={t}
          />
        )}
      </Field>

      <Field label="Password" error={errors.password?.message} theme={theme}>
        {(id, hasError, t) => (
          <Input
            {...bindField('password')}
            id={id}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••"
            hasError={hasError}
            theme={t}
          />
        )}
      </Field>

      {serverError && (
        <p role="alert" className="rounded-md border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        variant={theme === 'light' ? 'secondary' : 'primary'}
        fullWidth
        loading={register.isPending}
        className="mt-1"
      >
        Create Account
      </Button>
    </form>
  );
}
