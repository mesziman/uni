using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Grpc.Core;
using Grpc.Core.Utils;
using log4net;
using server.Domain;
using server.Service;
using Triathlon;

namespace server.Server
{
    public class GrpcServer : TriathlonService.TriathlonServiceBase, IServiceObserver
    {
        private static readonly ILog Log = LogManager.GetLogger("GrpcServer");
        private readonly Service.Service _service;
        private readonly Auth _auth;

        public GrpcServer(Service.Service service, Auth auth)
        {
            _service = service;
            _auth = auth;
        }

        public override Task<PingResponse> Ping(PingRequest request, ServerCallContext context)
        {
            bool loggedIn;
            bool subscribed;
            try
            {
                var client = _auth.GetClient(context);
                loggedIn = true;
                subscribed = client.IsSubscribed;
            }
            catch
            {
                loggedIn = false;
                subscribed = false;
            }

            return Task.FromResult(new PingResponse {LoggedIn = loggedIn, Subscribed = subscribed});
        }

        public override Task<ArbiterLoginResponse> LoginArbiter(ArbiterLoginRequest request,
            ServerCallContext context)
        {
            /*
             * Logout old client if possible.
             */
            try
            {
                _auth.RemoveClient(context);
            }
            catch
            {
                // ignored
            }

            /*
             * Retrieve the arbiter matching this name and password.
             */
            Arbiter arbiter;
            try
            {
                arbiter = _service.LoginArbiter(request.Name, request.Password);
            }
            catch
            {
                return Task.FromResult(new ArbiterLoginResponse {ErrorNo = ErrorNumber.InvalidLogin});
            }

            /*
             * Create client for the logged in arbiter.
             */
            _auth.CreateClient(context, arbiter);
            return Task.FromResult(new ArbiterLoginResponse {Arbiter = arbiter.ToProto()});
        }

        public override Task<ArbiterLogoutResponse> Logout(ArbiterLogoutRequest request, ServerCallContext context)
        {
            /*
             * Logout old client if possible.
             */
            try
            {
                _auth.RemoveClient(context);
            }
            catch
            {
                // ignored
            }

            return Task.FromResult(new ArbiterLogoutResponse());
        }

        public override async Task GetScores(ScoresRequest request, IServerStreamWriter<ScoreResponse> responseStream,
            ServerCallContext context)
        {
            try
            {
                _auth.GetClient(context);
            }
            catch (GrpcError e)
            {
                await responseStream.WriteAsync(new ScoreResponse {ErrorNo = e.ErrorNumber});
                return;
            }

            var scores = _service.GetScores();
            var protoScores = scores.Select(score => new ScoreResponse{Score = score.ToProto()});
            await responseStream.WriteAllAsync(protoScores);
        }

        public override async Task GetRankings(ScoresRequest request, IServerStreamWriter<ScoreResponse> responseStream,
            ServerCallContext context)
        {
            GrpcClient client;
            try
            {
                client = _auth.GetClient(context);
            }
            catch (GrpcError e)
            {
                await responseStream.WriteAsync(new ScoreResponse {ErrorNo = e.ErrorNumber});
                return;
            }
            
            var scores = _service.GetRankings(client.Arbiter.Type);
            var protoScores = scores.Select(score => new ScoreResponse{Score = score.ToProto()});
            await responseStream.WriteAllAsync(protoScores);
        }

        public override Task<ScoreResponse> SetScoreValue(SetScoreRequest request, ServerCallContext context)
        {
            GrpcClient client;
            
            try
            {
                client = _auth.GetClient(context);
            }
            catch (GrpcError e)
            {
                return Task.FromResult(new ScoreResponse {ErrorNo = e.ErrorNumber});
            }
            
            var score = _service.SetScoreValue(request.ParticipantId, client.Arbiter.Type, request.Value);
            return Task.FromResult(new ScoreResponse {Score = score.ToProto()});
        }

        public override Task SubscribeSetScore(SubscribeSetScoreRequest request,
            IServerStreamWriter<ScoreResponse> responseStream, ServerCallContext context)
        {
            GrpcClient client;
            try
            {
                client = _auth.GetClient(context);
            }
            catch (GrpcError e)
            {
                return Task.FromResult(new ScoreResponse {ErrorNo = e.ErrorNumber});
            }

            if (client.IsSubscribed)
            {
                return Task.FromResult(new ScoreResponse {ErrorNo = ErrorNumber.AlreadySubscribed});
            }

            client.SubscribeSetScore();
            
            while (client.GetPushedScore(out var score, context.CancellationToken))
            {
                if (score != null)
                {
                    responseStream.WriteAsync(new ScoreResponse {Score = score.ToProto()});
                }
            }

            return Task.CompletedTask;
        }

        public override Task<UnsubscribeSetScoreResponse> UnsubscribeSetScore(UnsubscribeSetScoreRequest request,
            ServerCallContext context)
        {
            GrpcClient client;
            try
            {
                client = _auth.GetClient(context);
            }
            catch (GrpcError)
            {
                return Task.FromResult(new UnsubscribeSetScoreResponse());
            }
            
            client.UnsubscribeSetScore();
            return Task.FromResult(new UnsubscribeSetScoreResponse());
        }

        public void OnSetScore(Score score)
        {
            foreach (var client in _auth.GetClients())
            {
                client.PushScore(score);
            }
        }
    }
}
