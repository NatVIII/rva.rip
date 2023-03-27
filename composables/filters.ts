// This file contains data relating to the city filters.

export const ALL_ID = 'All Cities';

export const MARIN_COUNTY_ID = 'Marin County';
export const SF_SAN_MATEO_COUNTY_ID = 'SF-San Mateo County';
export const ALAMEDA_COUNTY_ID = 'Alameda County';
export const SANTA_CLARA_COUNTY_ID = 'Santa Clara County';
export const SANTA_CRUZ_COUNTY_ID = 'Santa Cruz County';

export const ALL_CITIES_IN_MARIN_COUNTY_ID = 'All cities in Marin County';

export const OTHERS_IN_SF_SAN_MATEO_COUNTY_ID = 'Others in SF-San Mateo County';
export const OTHERS_IN_ALAMEDA_COUNTY_ID = 'Others in Alameda County';
export const OTHERS_IN_SANTA_CLARA_COUNTY_ID = 'Others in Santa Clara County';
export const OTHERS_IN_SANTA_CRUZ_COUNTY_ID = 'Others in Santa Cruz County';

// SF-San Mateo County Cities.
export const SAN_FRANCISCO_ID = 'San Francisco';

// Alameda County Cities.
export const OAKLAND_ID = 'Oakland';
export const BERKELEY_ID = 'Berkeley';

// Santa Clara County Cities.
export const SAN_JOSE_ID = 'San Jose';
export const SUNNYVALE_ID = 'Sunnyvale';

// Santa Cruz County Cities.
export const SANTA_CRUZ_ID = 'Santa Cruz';

const default_value = true;

// Note: cannot use LocalStorage due to SSR not having LocalStorage. Using LocalStorage would thus cause a hydration mismatch.
export const useIsAllCitiesInMarinCountyEnabled = () => {
	return useCookie(ALL_CITIES_IN_MARIN_COUNTY_ID, { default: () => default_value });
}

// SF-San Mateo County Cities.
export const useIsSanFranciscoEnabled = () => {
	return useCookie(SAN_FRANCISCO_ID, { default: () => default_value });
}
export const useIsOthersInSFSanMateoCountyEnabled = () => {
	return useCookie(OTHERS_IN_SF_SAN_MATEO_COUNTY_ID, { default: () => default_value });
}

// Alameda County Cities.
export const useIsOaklandEnabled = () => {
	return useCookie(OAKLAND_ID, {
		sameSite: 'strict',
		default: () => default_value
	});
}
export const useIsBerkeleyEnabled = () => {
	return useCookie(BERKELEY_ID, {
		sameSite: 'strict',
		default: () => default_value
	});
}

export const useIsOthersInAlamedaCountyEnabled = () => {
	return useCookie(OTHERS_IN_ALAMEDA_COUNTY_ID, {
		sameSite: 'strict',
		default: () => default_value
	});
}

// Santa Clara County Cities.
export const useIsSanJoseEnabled = () => {
	return useCookie(SAN_JOSE_ID, {
		sameSite: 'strict',
		default: () => default_value
	});
}
export const useIsSunnyvaleEnabled = () => {
	return useCookie(SUNNYVALE_ID, {
		sameSite: 'strict',
		default: () => default_value
	});
}
export const useIsOthersInSantaClaraCountyEnabled = () => {
	return useCookie(OTHERS_IN_SANTA_CLARA_COUNTY_ID, {
		sameSite: 'strict',
		default: () => default_value
	});
}

// Santa Cruz County Cities.
export const useIsSantaCruzEnabled = () => {
	return useCookie(SANTA_CRUZ_ID, {
		sameSite: 'strict',
		default: () => default_value
	});
}

export const useIsOthersInSantaCruzCountyEnabled = () => {
	return useCookie(OTHERS_IN_SANTA_CRUZ_COUNTY_ID, {
		sameSite: 'strict',
		default: () => default_value
	});
}
