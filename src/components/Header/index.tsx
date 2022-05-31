import Image from 'next/image';
import Link from 'next/link';
import { Container } from '../layouts/container';
import styles from './header.module.scss';

export default function Header() {
  return (
    <Container>
      <header className={styles.header}>
        <Link href="/">
          <a>
            <Image src="/Logo.svg" alt="logo" width={239} height={27} />
          </a>
        </Link>
      </header>
    </Container>
  );
}
