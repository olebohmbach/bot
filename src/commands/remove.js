const Command = require('../modules/commands/command');
const { MessageEmbed } = require('discord.js');

module.exports = class RemoveCommand extends Command {
	constructor(client) {
		const i18n = client.i18n.getLocale(client.config.locale);
		super(client, {
			internal: true,
			name: i18n('commands.remove.name'),
			description: i18n('commands.remove.description'),
			aliases: [],
			process_args: false,
			args: [
				{
					name: i18n('commands.remove.args.member.name'),
					description: i18n('commands.remove.args.member.description'),
					example: i18n('commands.remove.args.member.example'),
					required: true,
				},
				{
					name: i18n('commands.remove.args.ticket.name'),
					description: i18n('commands.remove.args.ticket.description'),
					example: i18n('commands.remove.args.ticket.example'),
					required: false,
				}
			]
		});
	}

	async execute(message, args) {
		let settings = await message.guild.settings;
		const i18n = this.client.i18n.getLocale(settings.locale);

		let ticket = message.mentions.channels.first() ?? message.channel;
		let t_row = await this.client.tickets.resolve(ticket.id, message.guild.id);

		if (!t_row) {
			return await message.channel.send(
				new MessageEmbed()
					.setColor(settings.error_colour)
					.setTitle(i18n('commands.remove.response.not_a_ticket.title'))
					.setDescription(i18n('commands.remove.response.not_a_ticket.description'))
					.setFooter(settings.footer, message.guild.iconURL())
			);
		}

		let member = message.mentions.members.first() ?? message.guild.members.cache.get(args);

		if (!member) {
			return await message.channel.send(
				new MessageEmbed()
					.setColor(settings.error_colour)
					.setTitle(i18n('commands.remove.response.no_member.title'))
					.setDescription(i18n('commands.remove.response.no_member.description'))
					.setFooter(settings.footer, message.guild.iconURL())
			);
		}

		if (t_row.creator !== message.author.id && !await message.member.isStaff()) {
			return await message.channel.send(
				new MessageEmbed()
					.setColor(settings.error_colour)
					.setTitle(i18n('commands.remove.response.no_permission.title'))
					.setDescription(i18n('commands.remove.response.no_permission.description'))
					.setFooter(settings.footer, message.guild.iconURL())
			);
		}

		if (message.channel.id !== ticket.id) {
			await message.channel.send(
				new MessageEmbed()
					.setColor(settings.success_colour)
					.setAuthor(member.user.username, member.user.displayAvatarURL())
					.setTitle(i18n('commands.remove.response.removed.title'))
					.setDescription(i18n('commands.remove.response.removed.description', member.toString(), ticket.toString()))
					.setFooter(settings.footer, message.guild.iconURL())
			);
		}

		await ticket.send(
			new MessageEmbed()
				.setColor(settings.colour)
				.setAuthor(member.user.username, member.user.displayAvatarURL())
				.setTitle(i18n('ticket.member_removed.title'))
				.setDescription(i18n('ticket.member_removed.description', member.toString(), message.author.toString()))
				.setFooter(settings.footer, message.guild.iconURL())
		);

		await ticket.permissionOverwrites
			.get(member.user.id)
			?.delete(`${message.author.tag} removed ${member.user.tag} from the ticket`);

		this.client.log.info(`${message.author.tag} removed ${member.user.tag} from ${ticket.id}`);
	}
};