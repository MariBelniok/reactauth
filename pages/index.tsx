import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { FormEvent, useContext, useState } from 'react'
import { AuthContext, SignInCredentials } from '../contexts/AuthContext'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
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
      <input type="text" value={password} onChange={(e: any) => setPassword(e.target.value)} />
      <button type='submit'>
        Entrar
      </button>
    </form>
  )
}

export default Home
