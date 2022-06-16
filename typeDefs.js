const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    users(
      pagination: PaginationInput
      filter: UserFilterInput
      sorting: UserSortingInput
    ): [User]
    getUserId(_id: ID): User
    updateUser(_id: ID): User

    getAllSongs(
      pagination: SongPaginationInput
      filter: SongFilterInput
      sorting: SongSortingInput
    ): [Song]

    getSongId(_id: ID): Song

    getAllPlaylist(
      filter: PlaylistFilterInput
      sorting: PlaylistSortingInput
    ): [Playlist]
    getOnePlaylist(_id: ID): Playlist
  }

  type Mutation {
    createUser(input: signupInput): User

    login(input: loginInput): Token

    updateUser(user_input: UserInput): User!

    createSong(song_input: songInput): Song

    updateSong(_id: ID!, input_song: songInput): Song!
    deleteSong(_id: ID): Boolean

    createPlaylist(playlist_input: playlistInput): Playlist
    addSongPlaylist(_id: ID!, song_ids: [ID]): Playlist!
    addCollabPlaylist(
      _id: ID!
      collaborator_ids: [ID]
      created_by: ID
    ): Playlist!
    deleteSongPlaylist(_id: ID!, song_ids: [ID]): Playlist!
    deleteCollabPlaylist(
      _id: ID!
      collaborator_ids: [ID]
      created_by: ID
    ): Playlist!
  }

  type User {
    _id: ID!
    name: String!
    email: String!
    user_type: UserTypeEnum
  }

  type Song {
    _id: ID!
    name: String
    genre: String
    duration: Int
    created_by: User
    count_document: Int
  }

  type Playlist {
    _id: ID!
    playlist_name: String
    song_ids: [Song]
    created_by: User
    collaborator_ids: [User]
  }

  type Token {
    token: String
  }

  input page {
    page: Int
    limit: Int
  }

  input signupInput {
    name: String!
    email: String!
    password: String!
    user_type: UserTypeEnum
  }

  input loginInput {
    email: String!
    password: String!
  }

  input UserInput {
    name: String
    email: String
    user_type: UserTypeEnum
  }

  input songInput {
    name: String
    genre: String
    duration: Int
  }

  input playlistInput {
    playlist_name: String
    song_ids: [ID]
  }

  input PaginationInput {
    limit: Int
    page: Int
  }

  input UserFilterInput {
    name: String
    user_type: UserTypeEnum
  }

  input UserSortingInput {
    name: SortingEnum
  }

  input SongPaginationInput {
    limit: Int
    page: Int
  }

  input SongFilterInput {
    name: String
    genre: String
    creator_name: String
  }

  input SongSortingInput {
    name: SortingEnum
    genre: SortingEnum
    creator_name: SortingEnum
  }

  input PlaylistFilterInput {
    playlist_name: String
    song_name: String
    creator_name: String
  }

  input PlaylistSortingInput {
    playlist_name: SortingEnum
    creator_name: SortingEnum
  }

  enum SortingEnum {
    asc
    desc
  }

  enum UserTypeEnum {
    Administrator
    Creator
    Enjoyer
  }
`;

module.exports = typeDefs;
