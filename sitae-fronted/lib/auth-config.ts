// lib/auth-config.ts
import GoogleProvider from 'next-auth/providers/google'
import { NextAuthOptions } from 'next-auth'
import { config, buildBackendUrl } from './config'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true;

      try {
        //   Llama al backend para autenticar
        const response = await fetch(buildBackendUrl('/api/auth/google'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            google_id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            access_token: account.id_token,
          }),
        });

        if (!response.ok) {
          console.error('Backend auth failed:', await response.text());
          return false;
        }

        const data = await response.json();
        
        user.token = data.access_token;
        
        return true;

      } catch (error) {
        console.error('Auth error:', error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user?.token) {
        token.token = user.token;
      }
      return token;
    },

    async session({ session, token }) {
      //   Pasa el token del JWT a la sesión
      session.token = token.token as string;
      return session;
    }
  },

  pages: {
    signIn: '/login',
  },
  
  secret: config.auth.secret,
}