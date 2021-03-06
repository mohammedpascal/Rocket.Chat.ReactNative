import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableHighlight, Text, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

import { actionsShow, errorActionsShow } from '../../actions/messages';
import Image from './Image';
import User from './User';
import Avatar from '../Avatar';
import Audio from './Audio';
import Video from './Video';
import Markdown from './Markdown';
import Url from './Url';
import Reply from './Reply';
import messageStatus from '../../constants/messagesStatus';

const styles = StyleSheet.create({
	content: {
		flexGrow: 1,
		flexShrink: 1
	},
	message: {
		padding: 12,
		paddingTop: 6,
		paddingBottom: 6,
		flexDirection: 'row',
		transform: [{ scaleY: -1 }]
	},
	textInfo: {
		fontStyle: 'italic',
		color: '#a0a0a0'
	},
	editing: {
		backgroundColor: '#fff5df'
	}
});

@connect(state => ({
	message: state.messages.message,
	editing: state.messages.editing
}), dispatch => ({
	actionsShow: actionMessage => dispatch(actionsShow(actionMessage)),
	errorActionsShow: actionMessage => dispatch(errorActionsShow(actionMessage))
}))
export default class Message extends React.Component {
	static propTypes = {
		item: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired,
		message: PropTypes.object.isRequired,
		user: PropTypes.object.isRequired,
		editing: PropTypes.bool,
		actionsShow: PropTypes.func,
		errorActionsShow: PropTypes.func
	}

	onLongPress() {
		const { item } = this.props;
		this.props.actionsShow(JSON.parse(JSON.stringify(item)));
	}

	onErrorPress() {
		const { item } = this.props;
		this.props.errorActionsShow(JSON.parse(JSON.stringify(item)));
	}

	getInfoMessage() {
		let message = '';
		const messageType = this.props.item.t;

		if (messageType === 'rm') {
			message = 'Message removed';
		} else if (messageType === 'uj') {
			message = 'Has joined the channel.';
		} else if (messageType === 'r') {
			message = `Room name changed to: ${ this.props.item.msg } by ${ this.props.item.u.username }`;
		} else if (messageType === 'message_pinned') {
			message = 'Message pinned';
		} else if (messageType === 'ul') {
			message = 'Has left the channel.';
		} else if (messageType === 'ru') {
			message = `User ${ this.props.item.msg } removed by ${ this.props.item.u.username }`;
		} else if (messageType === 'au') {
			message = `User ${ this.props.item.msg } added by ${ this.props.item.u.username }`;
		} else if (messageType === 'user-muted') {
			message = `User ${ this.props.item.msg } muted by ${ this.props.item.u.username }`;
		} else if (messageType === 'user-unmuted') {
			message = `User ${ this.props.item.msg } unmuted by ${ this.props.item.u.username }`;
		}

		return message;
	}

	isInfoMessage() {
		return ['r', 'au', 'ru', 'ul', 'uj', 'rm', 'user-muted', 'user-unmuted', 'message_pinned'].includes(this.props.item.t);
	}


	isDeleted() {
		return this.props.item.t === 'rm';
	}

	hasError() {
		return this.props.item.status === messageStatus.ERROR;
	}

	attachments() {
		if (this.props.item.attachments.length === 0) {
			return null;
		}

		const file = this.props.item.attachments[0];
		const { baseUrl, user } = this.props;
		if (file.image_type) {
			return <Image file={file} baseUrl={baseUrl} user={user} />;
		} else if (file.audio_type) {
			return <Audio file={file} baseUrl={baseUrl} user={user} />;
		} else if (file.video_type) {
			return <Video file={file} baseUrl={baseUrl} user={user} />;
		}

		return <Reply attachment={file} timeFormat={this.props.Message_TimeFormat} />;
	}

	renderMessageContent() {
		if (this.isInfoMessage()) {
			return <Text style={styles.textInfo}>{this.getInfoMessage()}</Text>;
		}
		return <Markdown msg={this.props.item.msg} />;
	}

	renderUrl() {
		if (this.props.item.urls.length === 0) {
			return null;
		}

		return this.props.item.urls.map(url => (
			<Url url={url} key={url._id} />
		));
	}

	renderError = () => {
		if (!this.hasError()) {
			return null;
		}
		return (
			<TouchableOpacity onPress={() => this.onErrorPress()}>
				<Icon name='error-outline' color='red' size={20} style={{ padding: 10, paddingRight: 12, paddingLeft: 0 }} />
			</TouchableOpacity>
		);
	}

	render() {
		const {
			item, message, editing, baseUrl
		} = this.props;

		const extraStyle = {};
		if (item.status === messageStatus.TEMP || item.status === messageStatus.ERROR) {
			extraStyle.opacity = 0.3;
		}

		const username = item.alias || item.u.username;
		const isEditing = message._id === item._id && editing;

		const accessibilityLabel = `Message from ${ item.alias || item.u.username } at ${ moment(item.ts).format(this.props.Message_TimeFormat) }, ${ this.props.item.msg }`;

		return (
			<TouchableHighlight
				onLongPress={() => this.onLongPress()}
				disabled={this.isDeleted() || this.hasError()}
				underlayColor='#FFFFFF'
				activeOpacity={0.3}
				style={[styles.message, isEditing ? styles.editing : null]}
				accessibilityLabel={accessibilityLabel}
			>
				<View style={{ flexDirection: 'row', flex: 1 }}>
					{this.renderError()}
					<View style={[extraStyle, { flexDirection: 'row', flex: 1 }]}>
						<Avatar
							style={{ marginRight: 10 }}
							text={item.avatar ? '' : username}
							size={40}
							baseUrl={baseUrl}
							avatar={item.avatar}
						/>
						<View style={[styles.content]}>
							<User
								onPress={this._onPress}
								item={item}
								Message_TimeFormat={this.props.Message_TimeFormat}
								baseUrl={baseUrl}
							/>
							{this.renderMessageContent()}
							{this.attachments()}
							{this.renderUrl()}
						</View>
					</View>
				</View>
			</TouchableHighlight>
		);
	}
}
