import{ Telegraf, session } from 'telegraf'
import{ message } from 'telegraf/filters'
import{ code } from 'telegraf/format'
import config from 'config'
import { ogg } from './ogg.js'
import { openai } from './openai.js'

const INITIAL_SESSION = {
    message: [],
}

console.log(config.get( 'TEST_ENV' ))

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

bot.use(session())

bot.command('new', async(ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду порнушки-голосовушки или хабовника-текстовика')
})

bot.command('start', async(ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду порнушки-голосовушки или хабовника-текстовика')
})

bot.on(message('voice'), async ctx => {
    ctx.session ??= INITIAL_SESSION
    try{
        await ctx.reply(code('Отъебсь, боту пизда. Влад код нихуя писать не умеет'))
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        console.log(link.href)
        const oggPath = await ogg.create(link.href, userId)
        const mp3Path = await ogg.toMp3(oggPath, userId)


        const text = await openai.transcription(mp3Path)
        await ctx.reply(code(`Вы пожаловали в господский дом с: ${text}`))

        ctx.session.messages.push({role: openai.roles.USER, content: text})

        const response = await openai.chat(ctx.session.messages) 

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT, 
            content: response.content,
        })

        await ctx.reply(response.content)
    } catch(e) {
        console.log('Errors while voice message', e.message) 
    } 
})

bot.on(message('text'), async ctx => {
    ctx.session ??= INITIAL_SESSION
    try{
        await ctx.reply(code('Отъебсь, боту пизда. Влад код нихуя писать не умеет'))

        ctx.session.messages.push({
            role: openai.roles.USER, 
            content: ctx.message.text,
        })

        const response = await openai.chat(ctx.session.messages) 

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT, 
            content: response.content,
        })

        await ctx.reply(response.content)
    } catch(e) {
        console.log('Errors while voice message', e.message) 
    } 
})


bot.launch()

process.once('SIGIN', () => bot.stop('SIGIN'));
process.once('SIGTERM', () => bot.stop('SIGTERM'))

   