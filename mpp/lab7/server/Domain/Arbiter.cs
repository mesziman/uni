﻿using Triathlon;

namespace server.Domain
{
    public class Arbiter
    {
        public int Id { get; set; }
        public string Name { get; }
        public string Password { get; }
        public ScoreType Type { get; }

        public Arbiter(int id, string name, string password, ScoreType type)
        {
            Id = id;
            Name = name;
            Password = password;
            Type = type;
        }

        public Arbiter(string name, string password, ScoreType type)
            : this(0, name, password, type)
        { }

        public override string ToString()
        {
            return $"Arbiter{{Id={Id}, Name={Name}, Type={Type}}}";
        }

        public ArbiterProto ToProto()
        {
            return new ArbiterProto {Id = Id, Name = Name, Type = ScoreTypeUtils.ToProto(Type)};
        }
    }
}
