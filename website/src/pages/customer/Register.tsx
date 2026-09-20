import { Navigate } from 'react-router-dom';

export default function CustomerRegister() {
  // Since we are using a unified OTP flow for both Login and Registration (Passwordless Auth),
  // we redirect the register route directly to the login page which handles both seamlessly.
  return <Navigate to="/customer/login" replace />;
}
