import { Injectable } from '@nestjs/common';

interface SlugDelegate {
  findFirst(args: {
    where: { slug: string; NOT?: { id: string } };
  }): Promise<{ slug: string } | null>;
}

@Injectable()
export class SlugService {
  async generateSlug(
    name: string,
    excludeId: string | undefined,
    prismaClient: SlugDelegate,
  ): Promise<string> {
    const slugName = name
      .toLowerCase()
      .normalize('NFD') // Normalizar caracteres especiales
      .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (tildes)
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .trim()
      .replace(/\s+/g, '-') // Reemplazar espacios por guiones
      .replace(/-+/g, '-'); // Remover guiones duplicados

    // Verificar si ya existe
    let finalSlug = slugName;
    let count = 1;

    while (true) {
      const slugExists = await prismaClient.findFirst({
        where: {
          slug: finalSlug,
          ...(excludeId && { NOT: { id: excludeId } }),
        },
      });

      if (!slugExists) {
        break; // Slug es único
      }

      finalSlug = `${slugName}-${count++}`; // Agregar sufijo numérico
    }

    return finalSlug;
  }
}
