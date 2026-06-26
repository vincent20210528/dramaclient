import type { GameCategoryItem } from '@/api/game'

const IMAGE_EXT_PATTERN = /\.(png|jpe?g|webp|gif|bmp)$/i

export function getBaseNameFromZip(filename: string): string {
    return filename.replace(/\.zip$/i, '').trim()
}

/** Blumgi-Rocket -> Blumgi Rocket */
export function formatGameNameFromBaseName(baseName: string): string {
    return baseName.replace(/[-_]+/g, ' ').trim()
}

export function findActionCategoryCode(categories: GameCategoryItem[]): string {
    const found = categories.find((item) => {
        const name = String(item.categoryName ?? '').trim().toLowerCase()
        const code = String(item.categoryCode ?? '').trim().toLowerCase()
        return name === 'action' || code === 'action' || name.includes('action')
    })
    return found?.categoryCode ?? ''
}

export function findEnglishLanguageCode(
    languages: { languageCode: string; languageName: string }[],
): string {
    const found = languages.find((item) => {
        const code = String(item.languageCode ?? '').trim().toLowerCase()
        const name = String(item.languageName ?? '').trim()
        return code === 'en' || code.startsWith('en-') || /english|英文/i.test(name)
    })
    return found?.languageCode ?? ''
}

function naturalCompare(a: string, b: string) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

export async function listImageFilesInDirectory(
    dirHandle: FileSystemDirectoryHandle,
): Promise<File[]> {
    const files: { name: string; file: File }[] = []
    for await (const [name, handle] of (dirHandle as any).entries()) {
        if (handle.kind === 'file' && IMAGE_EXT_PATTERN.test(name)) {
            files.push({ name, file: await handle.getFile() })
        }
    }
    files.sort((a, b) => naturalCompare(a.name, b.name))
    return files.map((item) => item.file)
}

export async function loadIconFileFromDirectory(
    iconDir: FileSystemDirectoryHandle,
    baseName: string,
): Promise<File | null> {
    const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']
    for (const ext of extensions) {
        try {
            const fileHandle = await iconDir.getFileHandle(`${baseName}${ext}`)
            return await fileHandle.getFile()
        } catch {
            // try next extension
        }
    }
    return null
}

export async function loadLocalGameAssets(
    rootHandle: FileSystemDirectoryHandle,
    baseName: string,
): Promise<{ iconFile: File | null; thumbnailFiles: File[] }> {
    let iconFile: File | null = null
    let thumbnailFiles: File[] = []

    try {
        const iconDir = await rootHandle.getDirectoryHandle('game_icon_imgs')
        iconFile = await loadIconFileFromDirectory(iconDir, baseName)
    } catch {
        // ignore missing icon directory
    }

    try {
        const thumbRoot = await rootHandle.getDirectoryHandle('game_thumbnail')
        const gameThumbDir = await thumbRoot.getDirectoryHandle(baseName)
        thumbnailFiles = await listImageFilesInDirectory(gameThumbDir)
    } catch {
        // ignore missing thumbnail directory
    }

    return { iconFile, thumbnailFiles }
}

/** 0 横屏，1 竖屏 */
export async function detectOrientationFromImage(file: File): Promise<0 | 1> {
    const bitmap = await createImageBitmap(file)
    const orientation: 0 | 1 = bitmap.width > bitmap.height ? 0 : 1
    bitmap.close?.()
    return orientation
}

export function supportsFileSystemAccessApi(): boolean {
    const win = window as Window & {
        showOpenFilePicker?: unknown
        showDirectoryPicker?: unknown
    }
    return typeof win.showOpenFilePicker === 'function' && typeof win.showDirectoryPicker === 'function'
}
