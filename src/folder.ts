import * as osa from "osa2";

import { Note } from "./note";

declare const Application: any;

/**
 * List all folders
 * @return       {Promise<Folder[]>} List of folders
 */
export function folders(): Promise<Folder[]> {
  return osa(() => {
    const Notes = Application("Notes");

    return Notes.folders().map((f) => {
      return {
        id: f.id(),
        name: f.name(),
      };
    });
  })().then((folders) => {
    return folders.map((f) => new Folder(f));
  });
}

export class Folder {

  /**
   * Find folder by name
   * @param  {string}            name Folder name
   * @return {Promise<Folder[]>}      List of Folders
   */
  public static find(name: string): Promise<Folder[]> {
    return osa((query) => {
      const Notes = Application("Notes");
      const folders = Notes.folders.where({
        name: query,
      });

      if (!folders.length) {
        throw new Error(`Folder ${query} note found`);
      }

      return folders().map((f) => {
        return {
          id: f.id(),
          name: f.name(),
        };
      });
    })(name).then((folders) => {
      return folders.map((f) => new Folder(f));
    });
  }

  /**
   * Create a new Folder
   * @param  {string} name        Name of the new folder
   * @param  {string} accountName (Optional) Account Name default = "iCloud"
   * @return {Promise<Folder>}             New Folder
   */
  public static create(name: string, accountName?: string): Promise<Folder> {
    return osa((query, accountName) => {
      const Notes = Application("Notes");

      const defaultAccount = "iCloud";
      const account = accountName ? Notes.accounts[accountName] : Notes.accounts[defaultAccount];

      if (account.folders.name().includes(query)) {
        throw new Error(`Folder ${query} already exists`);
      }
      const newFolder = Notes.Folder({ name: query });
      account.folders.push(newFolder);
      return {
        id: newFolder.id(),
        name: newFolder.name(),
      };
    })(name, accountName).then((folder) => new Folder(folder));

  }

  public id: string;
  public name: string;

  constructor(object?: any) {
    this.id = object.id;
    this.name = object.name;
  }

  /**
   * Delete Folder and its content
   * @return {Promise<any>}
   */
  public delete(): Promise<any> {
    return osa((folderId) => {
      const Notes = Application("Notes");
      return Notes.folders.byId(folderId).delete();
    })(this.id);
  }

  /**
   * List all notes of the folder
   * @return {Promise<Note[]>} List of notes
   */
  public notes(): Promise<Note[]> {
    return osa((folderId) => {
      const Notes = Application("Notes");
      const folder = Notes.folders.byId(folderId);
      return folder.notes().map((n) => {
        return {
          body: n.body(),
          creationDate: n.creationDate(),
          id: n.id(),
          modificationDate: n.modificationDate(),
          name: n.name(),
        };
      });
    })(this.id).then((notes) => {
      return notes.map((note) => new Note(note));
    });
  }

  public findNote(name: string): Promise<Note> {
    return Note.findByName(name, this.id);
  }

  /**
   * Create a note in the Folder
   * @param  {string}        name Folder Name
   * @return {Promise<Note>}      New Note
   */
  public createNote(name: string): Promise<Note> {
    const note = new Note({ name });
    return note.create(this.id);
  }
}
