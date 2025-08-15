import React, { type FormEvent } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider , signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebaseConfig'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Login: React.FC = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();
  
  const handleGoogle = () => {
      signInWithPopup(auth, provider)
      .then((result) => {

          const user = result.user;
          console.log(user)

          navigate('/');
      }).catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(errorCode)
            console.log(errorMessage)
      })
  }

  const handleSubmit = (e: FormEvent) => {
  
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log(user)
            navigate('/');
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode)
            console.log(errorMessage)
        })


        e.preventDefault()
    }

  return (
    <div className='bg-gray-900 h-dvh w-dvw flex justify-center'>
    <div className="z-10 flex flex-col items-center p-8 max-w-lg w-full
      bg-black/30 backdrop-blur-md h-dvh
      border border-cyan-400/20 rounded-xl
      shadow-2xl shadow-cyan-500/10">
      
      {/* Header section with title and back button */}
      <div className="w-full flex justify-between items-center mb-8">
        <h2 className="text-5xl font-bold text-cyan-300" style={{ textShadow: `0 0 8px #0ff` }}>Login</h2>
        <button className="text-purple-300 hover:text-white transition-colors duration-300 text-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Menu
        </button>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
        <div>
          <label htmlFor="email" className="block text-left text-cyan-300 text-sm font-bold mb-2">
            EMAIL
          </label>
          <input 
            type="email" 
            id="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value)
            }}
            className="w-full bg-gray-900/50 border-2 border-gray-700/50 rounded-lg px-4 py-3 text-white
            focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label htmlFor="password"  className="block text-left text-cyan-300 text-sm font-bold mb-2">
            PASSWORD
          </label>
          <input 
            type="password" 
            id="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setPassword(e.target.value)
            }}
            className="w-full bg-gray-900/50 border-2 border-gray-700/50 rounded-lg px-4 py-3 text-white
            focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
            placeholder="Enter your passcode"
          />
        </div>

        <button 
          type="submit"
          className="w-full mt-2 font-bold text-gray-900 bg-cyan-300 border-2 border-cyan-300 rounded-lg py-3
          transition-all duration-300 
          hover:bg-transparent hover:text-cyan-300
          hover:shadow-[0_0_20px_rgba(56,189,248,0.7)]"
        >
          ACCESS WITH EMAIL
        </button>
      </form>

      {/* Separator */}
      <div className="flex items-center w-full my-6">
        <hr className="flex-grow border-t border-gray-700/50" />
        <span className="px-4 text-gray-400">OR</span>
        <hr className="flex-grow border-t border-gray-700/50" />
      </div>

      {/* Google Auth Button */}
      <button 
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 font-bold text-white bg-transparent border-2 border-gray-700/50 rounded-lg py-3
        transition-all duration-300 
        hover:border-purple-400 hover:text-purple-300
        hover:shadow-[0_0_20px_rgba(192,132,252,0.5)]"
      >
        <svg className="w-6 h-6" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,36.405,44,30.633,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
        </svg>
        SIGN IN WITH GOOGLE
      </button>
      
      <p className="mt-8 text-sm text-gray-400">
        Don't have an account? <a href="/signup" className="font-bold text-purple-300 hover:underline">Create one here.</a>
      </p>
    </div>
    </div>
  );
};

export default Login;
