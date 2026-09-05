import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// Komutu kullanabilecek roller
const ALLOWED_ROLES = [
  '1540411075386671114',
  '1545749939978506270',
  '1544635663977156689'
];

// Takım rolleri
const TEAM_ROLES = [
'1541050489670598686',
'1541050519034798180,
'1541050568049561691,
'1541050615730413698,
'1541050662870188082,
'1541050701864509481,
'1541050739387011114,
'1541050772228145184,
'1541050803924766790,
'1541050850938589325,
'1541050876742078585,
'1541050900599021609,
'1541050934099058759,
'1541050985244262432,
'1541051033487282238,
'1541051176647139389
];

const CONTRACT_CHANNEL_ID = '1544635663977156689';

// Rol ID'leri
const ADMIN_STAFF_ROLES = [
  '1536076131600441396',
  '1536326544971268146'
];
const MANAGER_ROLE = '1545749939978506270';
const ASSISTANT_MANAGER_ROLE = '1545749981061972039';

export default {
  data: new SlashCommandBuilder()
    .setName('release')
    .setDescription('Release a player from your team')
    .addUserOption(option =>
      option
        .setName('player')
        .setDescription('The player to release')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the release')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const player = interaction.options.getUser('player');
    const reason = interaction.options.getString('reason');
    const releaser = interaction.user;

    // Yetki kontrolü
    const hasPermission = member.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));
    if (!hasPermission) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }

    // Manager'ın takım rolünü bul
    const managerTeamRole = member.roles.cache.find(role => TEAM_ROLES.includes(role.id));
    if (!managerTeamRole) {
      return interaction.reply({
        content: 'You do not have any team role.',
        ephemeral: true
      });
    }

    // Oyuncuyu çek
    const targetMember = await interaction.guild.members.fetch(player.id).catch(() => null);
    if (!targetMember) {
      return interaction.reply({
        content: 'Player not found in this server.',
        ephemeral: true
      });
    }

    // Aynı takımda mı kontrol et
    if (!targetMember.roles.cache.has(managerTeamRole.id)) {
      return interaction.reply({
        content: `This player is not in your team (**${managerTeamRole.name}**).`,
        ephemeral: true
      });
    }

    // Rolü kaldır
    try {
      await targetMember.roles.remove(managerTeamRole.id);
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: 'Failed to remove the team role. Check my permissions.',
        ephemeral: true
      });
    }

    // Released by unvanını belirle
    let roleTitle = 'Manager'; // varsayılan

    if (member.roles.cache.some(role => ADMIN_STAFF_ROLES.includes(role.id))) {
      roleTitle = 'Admin/Staff';
    } else if (member.roles.cache.has(MANAGER_ROLE)) {
      roleTitle = 'Manager';
    } else if (member.roles.cache.has(ASSISTANT_MANAGER_ROLE)) {
      roleTitle = 'Assistant Manager';
    }

    // Embed oluştur
    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🔒 Player Released')
      .setDescription(`**${player.username}** has been released by ${roleTitle.toLowerCase()}`)
      .addFields(
        { name: 'Player', value: `${player}`, inline: true },
        { name: 'Released by', value: `${releaser} (${roleTitle})`, inline: true },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Team', value: managerTeamRole.name, inline: true }
      )
      .setFooter({
        text: `VF • ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        })}`
      })
      .setTimestamp();

    // Komutu kullanan kişiye cevap
    await interaction.reply({ embeds: [embed] });

    // Contract kanalına gönder
    try {
      const contractChannel = await interaction.guild.channels.fetch(CONTRACT_CHANNEL_ID);
      if (contractChannel) {
        await contractChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Failed to send to contract channel:', error);
    }

    // Oyuncuya DM gönder
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('🔒 You have been released')
        .setDescription(`You have been released from **${managerTeamRole.name}** by ${releaser} (${roleTitle}).`)
        .addFields(
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'VF' })
        .setTimestamp();

      await player.send({ embeds: [dmEmbed] });
    } catch (error) {
      console.log(`Could not DM ${player.tag}`);
    }
  }
};
