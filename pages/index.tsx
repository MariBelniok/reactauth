import type { GetServerSideProps, NextPage } from 'next'
import { FormEvent, useContext, useState } from 'react'
import { AuthContext, SignInCredentials } from '../contexts/AuthContext'
import { parseCookies } from 'nookies'
import styles from '../styles/Home.module.css'
import { withSSRGuest } from '../utils/withSSRGuest'

export default function Home() {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();

  const { signIn } = useContext(AuthContext);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const data: SignInCredentials = {
      email: String(email),
      password: String(password)
    }

    await signIn(data);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.container} >
      <input type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
      <button type='submit'>
        Entrar
      </button>
    </form>
  )
}

export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {}
  }
});