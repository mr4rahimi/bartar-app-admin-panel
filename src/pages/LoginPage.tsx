import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const nav = useNavigate();

  async function onSubmit(data: any) {
    try {
      await login(data.phoneOrEmail, data.password);
      toast.success('ورود موفق');
      nav('/'); // داشبورد
    } catch (err:any) {
      toast.error(err?.response?.data?.message || 'خطا در ورود');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h3 className="text-xl font-bold mb-4">ورود ادمین</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input {...register('phoneOrEmail')} placeholder="ایمیل یا شماره تلفن" className="w-full p-2 border rounded" />
          <input {...register('password')} placeholder="رمز عبور" type="password" className="w-full p-2 border rounded" />
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-accent text-white rounded">ورود</button>
          </div>
        </form>
      </div>
    </div>
  );
}