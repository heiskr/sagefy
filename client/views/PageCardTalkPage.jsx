/* eslint-disable complexity */
import React from 'react'
import { shape, string, arrayOf } from 'prop-types'
import { convertUuidToUuid58 as to58 } from 'uuid58'
import Layout from './components/Layout'
import Icon from './components/Icon'
import FormErrorsTop from './components/FormErrorsTop'
import FormErrorsField from './components/FormErrorsField'
import Footer from './components/Footer'
import Topic from './components/Topic'

export default function TalkPage({
  hash,
  role,
  body,
  query,
  gqlErrors,
  entity: { entityId, name: entityName },
  topics,
}) {
  return (
    <Layout hash={hash} page="TalkPage" title="Talk" description="-">
      <header>
        <div className="my-c">
          <p>
            Page Card Talk <Icon i="page" />
            <Icon i="card" />
            <Icon i="talk" />
          </p>
          <h1>
            Talk: <a href={`/page-cards/${to58(entityId)}`}>{entityName}</a>
          </h1>
        </div>
        <small>
          <ul className="ls-i ta-r">
            {/* <li><a href="/mocks/follows">👂🏿 Follow</a></li> */}
            <li>
              <Icon i="talk" s="s" /> Talk
            </li>

            <li>
              <a href={`/page-cards/${to58(entityId)}/history`}>
                <Icon i="history" s="s" /> History
              </a>
            </li>
            <li>
              <a href={`/page-cards/${to58(entityId)}/edit`}>
                <Icon i="edit" s="s" /> Edit
              </a>
            </li>
          </ul>
        </small>
      </header>

      <section>
        {!!topics.length && (
          <h2>
            Topics on <q>{entityName}</q> <Icon i="topic" s="h2" />
          </h2>
        )}
        <ul className="ls-n">
          {topics.map(topic => (
            <Topic {...topic} gqlErrors={gqlErrors} body={body} query={query} />
          ))}
        </ul>
      </section>

      <section className="ta-c my-c">
        <p>
          {topics.length ? (
            <em>Don&apos;t see what you want to talk about?</em>
          ) : (
            <em>There&apos;s no topics yet! Be the first.</em>
          )}
        </p>
        <details id="create-topic-form">
          <summary>
            <h2 className="d-i">
              Create topic <Icon i="topic" s="h2" />{' '}
            </h2>
          </summary>
          <form method="POST" className="ta-l d-ib mx-a">
            <FormErrorsTop formErrors={gqlErrors} />
            <FormErrorsField formErrors={gqlErrors} field="all" />
            <input type="hidden" name="entityId" value={entityId} />
            <input type="hidden" name="entityKind" value="CARD" />
            <p>
              <label htmlFor="name">What should we call this new topic?</label>
              <input
                type="text"
                value={body.name}
                placeholder="example: Should we add more cards?"
                size="40"
                id="name"
                name="name"
                required
              />
            </p>
            <FormErrorsField formErrors={gqlErrors} field="name" />
            <button type="submit">
              <Icon i="topic" /> Create topic
            </button>
          </form>
        </details>
      </section>
      <Footer role={role} />
    </Layout>
  )
}

TalkPage.propTypes = {
  hash: string.isRequired,
  role: string.isRequired,
  body: shape({}),
  query: shape({}),
  gqlErrors: shape({}),
  entity: shape({ entityId: string, name: string, kind: string }).isRequired,
  topics: arrayOf(shape({})),
}

TalkPage.defaultProps = {
  gqlErrors: {},
  body: {},
  query: {},
  topics: [],
}
