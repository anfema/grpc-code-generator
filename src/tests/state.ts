export interface State {
	retries: number;
}

const state = new Map<string, State>();

export function getState(id: string): State {
	const info = state.get(id);

	if (info) {
		return info;
	}
	else {
		const newInfo = { retries: 0 };
		state.set(id, newInfo);
		return newInfo;
	}
}
