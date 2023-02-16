export const authenticate = async (endpoint, email, token) => {
	const url = `${endpoint}?email=${email}&token=${token}`
	const response = await fetch(url);
	const result = await response.json();
	return result;
};

export const parseBasicAuth = header => {
	const base64String = header.slice(6, -1);
	const buff = Buffer.from(base64String, 'base64');
	const utfString = buff.toString('utf-8');
	const [ email, token ] = utfString.split(':');
	return { email, token };
};
