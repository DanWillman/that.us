import auth0 from '$utils/security';
import * as Sentry from '@sentry/node';
import { logging } from '$utils/config';
import fetch from 'isomorphic-fetch';

import { QUERY_ME } from '$dataSources/api.that.tech/me';

Sentry.init({
	dsn: logging.dsn
});

const endpoint = `https://api.that.tech/graphql/`;

async function afterCallback(req, res, session, state) {
	console.log('in aftercallback');
	let body = {
		query: `
		${QUERY_ME}
		`,
		variables: {}
	};

	try {
		const results = await fetch(endpoint, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${session.accessToken}`
			},
			body: JSON.stringify(body)
		}).then((r) => r.json());

		console.log('fetch results', results);
		session.thatProfile = results.data.members?.me;

		console.log('session deets', session);
		return session;
	} catch (error) {
		console.error('Fetch Call Error', error);
		Sentry.captureException(error, { req });

		return session;
	}
}

export function get(req, res) {
	console.log('in callback get');
	try {
		return auth0.handleCallback(req, { afterCallback });
	} catch (error) {
		console.error('callback error:', error);
		Sentry.captureException(error, { req });
		res.status(error.status || 400).end(error.message);
	}
}
