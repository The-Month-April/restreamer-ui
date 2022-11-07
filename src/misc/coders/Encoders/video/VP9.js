import React from 'react';
import SemverSatisfies from 'semver/functions/satisfies';

import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';

import { Trans } from '@lingui/macro';

import Select from '../../../Select';
import Video from '../../settings/Video';

function init(initialState) {
	const state = {
		bitrate: '4096',
		fps: '25',
		gop: '2',
		fps_mode: 'auto',
		...initialState,
	};

	return state;
}

function createMapping(settings, skills) {
	let ffversion = 4;
	if (SemverSatisfies(skills.ffmpeg.version, '^5.0.0')) {
		ffversion = 5;
	}

	const local = [
		'-codec:v',
		'libvpx-vp9',
		'-b:v',
		`${settings.bitrate}k`,
		'-maxrate:v',
		`${settings.bitrate}k`,
		'-bufsize:v',
		`${settings.bitrate}k`,
		'-r',
		`${settings.fps}`,
		'-sc_threshold',
		'0',
		'-pix_fmt',
		'yuv420p',
	];

	if (settings.gop !== 'auto') {
		local.push(
			'-g',
			`${Math.round(parseInt(settings.fps) * parseInt(settings.gop)).toFixed(0)}`,
			'-keyint_min',
			`${Math.round(parseInt(settings.fps) * parseInt(settings.gop)).toFixed(0)}`
		);
	}

	if (ffversion === 5) {
		local.push('-fps_mode', `${settings.fps_mode}`);
	}

	const mapping = {
		global: [],
		local: local,
	};

	return mapping;
}

function FpsMode(props) {
	return (
		<Select label={<Trans>Frames per second mode</Trans>} value={props.value} onChange={props.onChange}>
			<MenuItem value="passthrough"><Trans>Frame is passed (Passthrough)</Trans></MenuItem>
			<MenuItem value="cfr"><Trans>Constant frame rate (CFR)</Trans></MenuItem>
			<MenuItem value="vfr"><Trans>Variable frame rate (VFR)</Trans></MenuItem>
			<MenuItem value="auto"><Trans>Chooses between CRF and VFR (Auto)</Trans></MenuItem>
		</Select>
	);
}

FpsMode.defaultProps = {
	value: '',
	onChange: function (event) {},
};

function Coder(props) {
	const settings = init(props.settings);
	let ffversion = 4;
	if (SemverSatisfies(props.skills.ffmpeg.version, '^5.0.0')) {
		ffversion = 5;
	}

	const handleChange = (newSettings) => {
		let automatic = false;
		if (!newSettings) {
			newSettings = settings;
			automatic = true;
		}

		props.onChange(newSettings, createMapping(newSettings, props.skills), automatic);
	};

	const update = (what) => (event) => {
		const newSettings = {
			...settings,
			[what]: event.target.value,
		};

		handleChange(newSettings);
	};

	React.useEffect(() => {
		handleChange(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<Video.Bitrate value={settings.bitrate} onChange={update('bitrate')} allowCustom />
			</Grid>
			<Grid item xs={12} md={6}>
				<Video.Framerate value={settings.fps} onChange={update('fps')} allowCustom />
			</Grid>
			<Grid item xs={12} md={6}>
				<Video.GOP value={settings.gop} onChange={update('gop')} allowAuto allowCustom />
			</Grid>
			{ffversion === 5 && (
				<Grid item xs={12}>
					<FpsMode value={settings.fps_mode} onChange={update('fps_mode')} />
				</Grid>
			)}
		</Grid>
	);
}

Coder.defaultProps = {
	stream: {},
	settings: {},
	skills: {},
	onChange: function (settings, mapping) {},
};

const coder = 'libvpx-vp9';
const name = 'VP9 (libvpx-vp9)';
const codec = 'vp9';
const type = 'video';
const hwaccel = false;

function summarize(settings) {
	return `${name}, ${settings.bitrate} kbit/s, ${settings.fps} FPS, Preset: ${settings.preset}, Profile: ${settings.profile}`;
}

function defaults(skills) {
	const settings = init({});

	return {
		settings: settings,
		mapping: createMapping(settings, skills),
	};
}

export { coder, name, codec, type, hwaccel, summarize, defaults, Coder as component };
