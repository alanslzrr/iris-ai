import { LoginGradient } from '@/components/gradients/login-gradient';
import '../../styles/login.css';
import { GoogleLoginButton } from '@/components/authentication/google-login-button';

export default function LoginPage() {
  return (
    <div>
      <LoginGradient />
      <div className={'flex flex-col items-center justify-center min-h-screen'}>
        <div
          className={
            'w-[343px] md:w-[488px] gap-5 flex-col rounded-2xl relative overflow-hidden'
          }
          style={{
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* Background gradient effects - Updated with new brand colors */}
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              background: 'radial-gradient(ellipse 400px 300px at 50% 0%, rgba(244, 67, 54, 0.15) 0%, transparent 70%)',
              filter: 'blur(30px)',
              zIndex: 0
            }}
          />
          
          {/* Animated border gradient - Updated with new brand colors */}
          <div 
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.3) 0%, rgba(255, 152, 0, 0.2) 50%, rgba(255, 235, 59, 0.1) 100%)',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              padding: '1px',
              zIndex: 0
            }}
          />
          
          <div className="relative z-10">
            <GoogleLoginButton />
          </div>
        </div>
      </div>
    </div>
  );
}
