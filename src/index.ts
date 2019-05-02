import {
  ExtensionContext,
  workspace,
  CompleteOption,
  ISource,
  sources,
  SourceType,
} from 'coc.nvim'

import which from 'which'

import { spawn } from 'child_process'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions } = context

  try {
    which.sync('lbdbq')
  } catch (e) {
    workspace.showMessage('lbdbq required for coc-lbdbq', 'warning')
    return
  }

  let source: ISource = {
    name: 'lbdbq',
    enable: true,
    filetypes: ['mail'],
    priority: 99,
    sourceType: SourceType.Service,
    triggerPatterns: [
      /^(Bcc|Cc|From|Reply-To|To):\s*/,
      /^(Bcc|Cc|From|Reply-To|To):.*,\s*/,
    ],
    doComplete: async function(opt: CompleteOption) {
      if (!opt.input) {
        return
      }

      const { input } = opt

      const matches = await query(input)

      return {
        items: matches.map(m => {
          return {
            word: `${m.name} <${m.email}>`,
          }
        }),
      }
    },
  }

  subscriptions.push(sources.addSource(source))
}

function query(input: string): Promise<Match[]> {
  return new Promise((resolve, reject) => {
    const lbdbq = spawn('lbdbq', [input])

    let matches: Match[] = []
    let first = true
    lbdbq.stdout.on('data', data => {
      if (first) {
        first = false
        return
      }

      data
        .toString()
        .split('\n')
        .slice(0, -1)
        .forEach((m: string) => {
          const [email, name] = m
            .toString()
            .split(/\t/)
            .slice(0, 2)
          matches.push({ email, name })
        })
    })

    lbdbq.on('exit', () => resolve(matches))

    lbdbq.on('error', err => reject(err))
  })
}

interface Match {
  name: string
  email: string
}
