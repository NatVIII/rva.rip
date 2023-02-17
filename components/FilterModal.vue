<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
const props = defineProps<{
	title?: string
	allCallback: (newIsEnabled: boolean) => void
	cityCallback: (newIsEnabled: boolean, city: string) => void
	countyCallback: (newIsEnabled: boolean, county: string) => void
}>()
const emit = defineEmits<{
	(e: 'confirm'): void
}>()

// There's a lot of redundancy with the cities and counties between this component and the App component.
// Try to reduce it in the future.

// Use composable.
const isAllCitiesInMarinCountyEnabled = useIsAllCitiesInMarinCountyEnabled();
const isSanFranciscoEnabled = useIsSanFranciscoEnabled();
const isOthersInSFSanMateoCountyEnabled = useIsOthersInSFSanMateoCountyEnabled();
const isOaklandEnabled = useIsOaklandEnabled();
const isBerkeleyEnabled = useIsBerkeleyEnabled();
const isOthersInAlamedaCountyEnabled = useIsOthersInAlamedaCountyEnabled();
const isSanJoseEnabled = useIsSanJoseEnabled();
const isOthersInSantaClaraCountyEnabled = useIsOthersInSantaClaraCountyEnabled();
const isSantaCruzEnabled = useIsSantaCruzEnabled();
const isOthersInSantaCruzCountyEnabled = useIsOthersInSantaCruzCountyEnabled();

const countyIdToCitiesRefs = {
	[MARIN_COUNTY_ID]: [isAllCitiesInMarinCountyEnabled],
	[SF_SAN_MATEO_COUNTY_ID]: [isSanFranciscoEnabled, isOthersInSFSanMateoCountyEnabled],
	[ALAMEDA_COUNTY_ID]: [isOaklandEnabled, isBerkeleyEnabled, isOthersInAlamedaCountyEnabled],
	[SANTA_CLARA_COUNTY_ID]: [isSanJoseEnabled, isOthersInSantaClaraCountyEnabled],
	[SANTA_CRUZ_COUNTY_ID]: [isSantaCruzEnabled, isOthersInSantaCruzCountyEnabled],
};

// This function is needed because, since the CityFilterItem component is nested within this component,
// the changes to the state from the App component will not cause a re-render of the CityFilterItem components.
const updateIsCityEnabledLocally = (newIsEnabled, county) => {
	countyIdToCitiesRefs[county].forEach((city) => {
		city.value = newIsEnabled;
	});
}

const countyWrapper = (newIsEnabled: boolean, county: string) => {
	updateIsCityEnabledLocally(newIsEnabled, county);
	props.countyCallback(newIsEnabled, county);
}

const allWrapper = (newIsEnabled: boolean) => {
	updateAllIsCityEnabledLocally(newIsEnabled);
	props.allCallback(newIsEnabled);
}

const updateAllIsCityEnabledLocally = (newIsEnabled) => {
	Object.values(countyIdToCitiesRefs).forEach((cities) => {
		cities.forEach((city) => {
			city.value = newIsEnabled;
		});
	});
}

</script>
<template>
	<VueFinalModal class="popper-box-wrapper" content-class="popper-box-inner" overlay-transition="vfm-fade"
		content-transition="vfm-fade">
		<CountyFilterItem :label="ALL_ID" @on-yes="allWrapper(true)" @on-no="allWrapper(false)">
		</CountyFilterItem>

		<CountyFilterItem :label="MARIN_COUNTY_ID"
			@on-yes="countyWrapper(true, MARIN_COUNTY_ID); (() => { useIsAllCitiesInMarinCountyEnabled.value = true })()"
			@on-no="countyWrapper(false, MARIN_COUNTY_ID); ">
			<CityFilterItem v-model="isAllCitiesInMarinCountyEnabled" :label="ALL_CITIES_IN_MARIN_COUNTY_ID"
				@on-input="cityCallback($event.target.checked, ALL_CITIES_IN_MARIN_COUNTY_ID)">
			</CityFilterItem>
		</CountyFilterItem>

		<CountyFilterItem :label="SF_SAN_MATEO_COUNTY_ID" @on-yes="countyWrapper(true, SF_SAN_MATEO_COUNTY_ID)"
			@on-no="countyWrapper(false, SF_SAN_MATEO_COUNTY_ID)">
			<CityFilterItem v-model="isSanFranciscoEnabled" :label="SAN_FRANCISCO_ID"
				@on-input="cityCallback($event.target.checked, SAN_FRANCISCO_ID)">
			</CityFilterItem>
			<CityFilterItem v-model="isOthersInSFSanMateoCountyEnabled" :label="OTHERS_IN_SF_SAN_MATEO_COUNTY_ID"
				@on-input="cityCallback($event.target.checked, OTHERS_IN_SF_SAN_MATEO_COUNTY_ID)">
			</CityFilterItem>
		</CountyFilterItem>

		<CountyFilterItem :label="ALAMEDA_COUNTY_ID" @on-yes="countyWrapper(true, ALAMEDA_COUNTY_ID)"
			@on-no="countyWrapper(false, ALAMEDA_COUNTY_ID)">
			<CityFilterItem v-model="isOaklandEnabled" :label="OAKLAND_ID"
				@on-input="cityCallback($event.target.checked, OAKLAND_ID)">
			</CityFilterItem>
			<CityFilterItem v-model="isBerkeleyEnabled" :label="BERKELEY_ID"
				@on-input="cityCallback($event.target.checked, BERKELEY_ID)">
			</CityFilterItem>
			<CityFilterItem v-model="isOthersInAlamedaCountyEnabled" :label="OTHERS_IN_ALAMEDA_COUNTY_ID"
				@on-input="cityCallback($event.target.checked, OTHERS_IN_ALAMEDA_COUNTY_ID)">
			</CityFilterItem>
		</CountyFilterItem>

		<CountyFilterItem :label="SANTA_CLARA_COUNTY_ID" @on-yes="countyWrapper(true, SANTA_CLARA_COUNTY_ID)"
			@on-no="countyWrapper(false, SANTA_CLARA_COUNTY_ID)">
			<CityFilterItem v-model="isSanJoseEnabled" :label="SAN_JOSE_ID"
				@on-input="cityCallback($event.target.checked, SAN_JOSE_ID)">
			</CityFilterItem>
			<CityFilterItem v-model="isOthersInSantaClaraCountyEnabled" :label="OTHERS_IN_SANTA_CLARA_COUNTY_ID"
				@on-input="cityCallback($event.target.checked, OTHERS_IN_SANTA_CLARA_COUNTY_ID)">
			</CityFilterItem>
		</CountyFilterItem>

		<CountyFilterItem :label="SANTA_CRUZ_COUNTY_ID" @on-yes="countyWrapper(true, SANTA_CRUZ_COUNTY_ID)"
			@on-no="countyWrapper(false, SANTA_CRUZ_COUNTY_ID)">
			<CityFilterItem v-model="isSantaCruzEnabled" :label="SANTA_CRUZ_ID"
				@on-input="cityCallback($event.target.checked, SANTA_CRUZ_ID)">
			</CityFilterItem>
			<CityFilterItem v-model="isOthersInSantaCruzCountyEnabled" :label="OTHERS_IN_SANTA_CRUZ_COUNTY_ID"
				@on-input="cityCallback($event.target.checked, OTHERS_IN_SANTA_CRUZ_COUNTY_ID)">
			</CityFilterItem>
		</CountyFilterItem>
		<div class="bottom">

			<button @click="emit('confirm')">
				Done
			</button>
		</div>
	</VueFinalModal>
</template>