import React from 'react'
import { string, shape, arrayOf } from 'prop-types'
import Layout from './components/Layout'
import Icon from './components/Icon'
import Footer from './components/Footer'
import ChooseSubject from './components/ChooseSubject'
import SubjectForm from './components/SubjectForm'

export default function SearchSubjectsPage({
  role,
  query: { q },
  subjects,
  hash,
}) {
  return (
    <Layout
      hash={hash}
      page="SearchSubjectsPage"
      title="Search subjects"
      description="Find the learning subject you are looking for. Anything you want to learn, Sagefy can help you."
    >
      <section className="ta-c">
        <h1>
          What do you want to learn? <Icon i="search" s="h1" />
        </h1>
        <form action="/subjects/search">
          <p>
            <input
              type="search"
              size="40"
              value={q}
              placeholder="example: Music"
              autoFocus={!!q}
              name="q"
            />
          </p>
          <p>
            <button type="submit">
              <Icon i="search" /> Search
            </button>
          </p>
        </form>
      </section>

      {subjects && subjects.length ? (
        <section>
          <h2>
            Choose from one of these subjects <Icon i="subject" s="h2" />
          </h2>
          <ChooseSubject subjects={subjects} level="goal" />
        </section>
      ) : null}

      {q ? (
        <section className="my-c">
          <p>
            <em>
              Not seeing what you want? <Icon i="error" />
            </em>
          </p>
          <details open={!subjects || !subjects.length}>
            <summary>
              <h2 className="d-i">
                You can suggest a new subject <Icon i="subject" s="h2" />
              </h2>
            </summary>
            <SubjectForm role={role} preset={{ name: q }} />
          </details>
        </section>
      ) : (
        <section>
          <h2>
            Searching on Sagefy <Icon i="search" s="h2" />
          </h2>
          <p>
            If you&apos;re wanting to learn a new subject, enter your goal in
            the box above!
          </p>
          <p>
            Are you wanting to see everything Sagefy has on a topic? Found
            something that needs an edit? Do you want to make some new cards?{' '}
            <a href="/search">Search everything instead.</a>
          </p>
        </section>
      )}

      <Footer role={role} />
    </Layout>
  )
}

SearchSubjectsPage.propTypes = {
  hash: string.isRequired,
  role: string,
  query: shape({}).isRequired,
  subjects: arrayOf(
    shape({
      entityId: string.isRequired,
      name: string.isRequired,
      body: string.isRequired,
    })
  ),
}

SearchSubjectsPage.defaultProps = {
  role: 'sg_anonymous',
  subjects: [],
}
