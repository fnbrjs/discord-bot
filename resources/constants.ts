import { ColorResolvable } from 'discord.js';

interface Colors {
  SUCCESS_GREEN: ColorResolvable,
  ERROR_RED: ColorResolvable,
  WARN_YELLOW: ColorResolvable,
}

export const colors: Readonly<Colors> = Object.freeze({
  SUCCESS_GREEN: '#00D166',
  ERROR_RED: '#F93A2F',
  WARN_YELLOW: '#f9d72f',
});

export const LogEvents = {
  COMMAND_USED: 'command_used',
  COMMAND_ERROR: 'command_error',
  REACTION_ROLE_ERROR: 'reaction_role_error',
  HTTP_REQUEST_SENT: 'http_request_sent',
  HTTP_RESPONSE_RECEIVED: 'http_response_received',
  HTTP_RESPONSE_ERROR: 'http_response_error',
};

export const Guilds = {
  APPDEV: '522121965952303105',
  FNBRJS: '683777732584538231',
};

export const Channels = {
  PROJECTS_PRESENTATIONS: '1031645489763983411',
};

export const emojiRegex = /((<a?)?:\w+:(\d{18}>)|(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]))/;
