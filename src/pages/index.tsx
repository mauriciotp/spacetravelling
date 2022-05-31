import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { Container } from '../components/layouts/container';
import { RichText } from 'prismic-dom';
import Link from 'next/link';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  return (
    <>
      <Container>
        <section className={styles.posts}>
          {postsPagination.results.map(post => (
            <div className={styles.postCard} key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <h2>{post.data.title}</h2>
                </a>
              </Link>
              <p className={styles.postResume}>{post.data.subtitle}</p>
              <div className={styles.info}>
                <span>
                  <FiCalendar />
                  <p>{post.first_publication_date}</p>
                </span>
                <span>
                  <FiUser />
                  <p>{post.data.author}</p>
                </span>
              </div>
            </div>
          ))}
        </section>

        {postsPagination.next_page === null ? null : (
          <button className={styles.loadMorePostsButton}>
            Carregar mais posts
          </button>
        )}
      </Container>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('post', {
    pageSize: 5,
  });

  const posts = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: format(
      new Date(post.first_publication_date),
      'd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  const next_page = postsResponse.next_page;

  return {
    props: {
      postsPagination: {
        next_page,
        results: posts,
      },
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
