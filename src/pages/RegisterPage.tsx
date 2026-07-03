import { useState } from 'react';
import {
  PHeading,
  PText,
  PInputText,
  PInputPassword,
  PButton,
  PInlineNotification,
} from '@porsche-design-system/components-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onNavigate: (page: string) => void;
}

export default function RegisterPage({ onNavigate }: Props) {
  const { setUser, setProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    setLoading(true);

    try {
      const data = await api.register(username, email, password);
      setUser(data.session.user);
      setProfile(data.profile);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-fluid-md">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-lg p-fluid-lg" style={{ boxShadow: '0px 4px 16px rgba(0,0,0,.08)' }}>
          <div className="mb-fluid-md">
            <PHeading size="x-large" tag="h1">Create account</PHeading>
            <PText className="mt-static-xs text-contrast-medium">Join the community today</PText>
          </div>

          {error && (
            <div className="mb-fluid-sm">
              <PInlineNotification
                state="error"
                heading="Registration failed"
                description={error}
                dismissButton={false}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-fluid-sm">
            <PInputText
              label="Username"
              name="username"
              value={username}
              onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
              required
              maxLength={30}
              counter
              autoComplete="username"
            />
            <PInputText
              label="Email"
              name="email"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              required
              autoComplete="email"
            />
            <PInputPassword
              label="Password"
              name="password"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              toggle
              required
              minLength={6}
              autoComplete="new-password"
            />
            <PButton type="submit" loading={loading} className="mt-static-xs">
              Create Account
            </PButton>
          </form>

          <div className="mt-fluid-sm text-center flex flex-col gap-2">
            <PText>
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-primary underline cursor-pointer bg-transparent border-none font-inherit"
              >
                Sign In
              </button>
            </PText>
            <div>
              <button
                onClick={() => onNavigate('landing')}
                className="text-contrast-medium hover:text-primary text-sm underline cursor-pointer bg-transparent border-none mt-2 font-medium transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
