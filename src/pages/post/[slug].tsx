import { GetStaticPaths, GetStaticProps } from 'next';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { Container } from '../../components/layouts/container';
import { getPrismicClient } from '../../services/prismic';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  readingTime: {
    timeFormat?: string;
    totalMinutes?: number;
    minutesRounded?: number;
  };
}
export default function Post({ post, readingTime }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <div className={styles.imgContainer}>
        <Image
          src={post.data.banner.url}
          alt="banner"
          width={1440}
          height={400}
        />
      </div>
      <Container>
        <section className={styles.post}>
          <div className={styles.title}>
            <h1>{post.data.title}</h1>
            <div className={styles.info}>
              <span>
                <FiCalendar />
                <p>{post.first_publication_date}</p>
              </span>
              <span>
                <FiUser />
                <p>{post.data.author}</p>
              </span>
              <span>
                <FiClock />
                {readingTime.timeFormat === 'seconds' ? (
                  <p>{readingTime.totalMinutes} s</p>
                ) : (
                  <p>{readingTime.minutesRounded} min</p>
                )}
              </span>
            </div>
          </div>
          {post.data.content.map(({ heading, body }, index) => (
            <div className={styles.content} key={heading}>
              <h2>{heading}</h2>
              <div dangerouslySetInnerHTML={{ __html: body[index].text }}></div>
            </div>
          ))}
        </section>
      </Container>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('post', {
    pageSize: 5,
  }); // TODO change this

  const uids = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths: uids,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('post', String(slug));

  // console.log(JSON.stringify(response.data.content, null, 2));

  const body = response.data.content.map(content => ({
    text: RichText.asHtml(content.body),
  }));

  const readingTime = response.data.content.reduce((acc, content, index) => {
    const allText = `${content.heading} ${RichText.asText(content.body)}`;
    const wordsArray = allText.split(/\s+/);
    const wordsAmount = wordsArray.length;

    const totalMinutes = acc + wordsAmount / 200;

    const minutesRounded = Math.floor(totalMinutes);

    if (index === response.data.content.length - 1 && minutesRounded < 1) {
      const totalMinutesFormatted = (totalMinutes * 60).toFixed(2);
      return {
        timeFormat: 'seconds',
        totalMinutes: totalMinutesFormatted,
      };
    }

    return minutesRounded;
  }, 0);

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body,
      })),
    },
  };

  return {
    props: {
      post,
      readingTime,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
